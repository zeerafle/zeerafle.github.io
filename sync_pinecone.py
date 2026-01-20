import hashlib
import os

from dotenv import load_dotenv
from git import Repo
from langchain_community.document_loaders import UnstructuredMarkdownLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pinecone import Pinecone

load_dotenv()

pc = Pinecone()
index_name = os.getenv("INDEX_NAME", "personal-website")

if not pc.has_index(index_name):
    pc.create_index_for_model(
        name=index_name,
        cloud="aws",
        region="us-east-1",
        embed={"model": "multilingual-e5-large", "field_map": {"text": "text"}},
    )

index = pc.Index(index_name)


def get_file_hash(file_path):
    """Generate MD5 hash of file content"""
    with open(file_path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()


def get_existing_files_from_pinecone(namespace="__default__"):
    """Query Pinecone to get all existing file metadata"""
    try:
        stats = index.describe_index_stats()
        total_vectors = stats.namespaces.get(namespace, {}).get("vector_count", 0)

        if total_vectors == 0:
            return {}

        # Query with dummy vector to get all records
        # Use a zero vector with the correct dimension
        dimension = stats.dimension
        dummy_vector = [0.0] * dimension

        existing_files = {}

        # Query in batches to get all vectors
        top_k = min(10000, total_vectors)
        results = index.query(
            vector=dummy_vector, top_k=top_k, include_metadata=True, namespace=namespace
        )

        for match in results.matches:
            file_name = match.metadata.get("file_name")
            content_hash = match.metadata.get("content_hash", "")
            if file_name:
                existing_files[file_name] = content_hash

        print(f"Found {len(existing_files)} unique files in Pinecone")
        return existing_files

    except Exception as e:
        print(f"Error querying existing files: {e}")
        return {}


def clone_and_load_repo(github_url, local_dir):
    """Clone or pull repository and load markdown documents"""
    if os.path.exists(local_dir):
        print("Pulling latest changes from repository...")
        Repo(local_dir).remotes.origin.pull()
    else:
        print("Cloning repository...")
        Repo.clone_from(github_url, local_dir)

    documents = []
    current_files = {}
    excludes = ["README.md", "LICENSE"]

    for root, _, files in os.walk(local_dir):
        for file in files:
            if file.endswith(".md") and file not in excludes:
                file_path = os.path.join(root, file)
                file_name = os.path.splitext(file)[0]

                # Calculate content hash
                content_hash = get_file_hash(file_path)
                current_files[file_name] = content_hash

                # Load document
                loader = UnstructuredMarkdownLoader(file_path)
                docs = loader.load()

                for doc in docs:
                    # Determine document type based on path
                    if "_portfolio" in root:
                        doc.metadata["document_type"] = "portfolio"
                        doc.metadata["category"] = "portfolio"
                    elif "_posts" in root:
                        doc.metadata["document_type"] = "post"
                        doc.metadata["category"] = "post"
                    else:
                        doc.metadata["document_type"] = "general"
                        doc.metadata["category"] = "general"

                    doc.metadata["file_name"] = file_name
                    doc.metadata["file_path"] = file_path
                    doc.metadata["content_hash"] = content_hash
                    documents.append(doc)

    return documents, current_files


def delete_removed_files(existing_files, current_files, namespace="__default__"):
    """Delete vectors for files that no longer exist"""
    removed_files = set(existing_files.keys()) - set(current_files.keys())

    if removed_files:
        print(f"Deleting {len(removed_files)} removed files from Pinecone...")
        for file_name in removed_files:
            try:
                index.delete(
                    filter={"file_name": {"$eq": file_name}}, namespace=namespace
                )
                print(f"  - Deleted: {file_name}")
            except Exception as e:
                print(f"  - Error deleting {file_name}: {e}")
    else:
        print("No files removed")


def get_files_to_update(existing_files, current_files):
    """Identify new or modified files"""
    files_to_update = []

    for file_name, content_hash in current_files.items():
        existing_hash = existing_files.get(file_name)

        if existing_hash is None:
            # New file
            files_to_update.append(file_name)
            print(f"  - New file: {file_name}")
        elif existing_hash != content_hash:
            # Modified file
            files_to_update.append(file_name)
            print(f"  - Modified file: {file_name}")

    return files_to_update


def save_vector_store(docs, files_to_update, namespace="__default__"):
    """Save documents to Pinecone, only updating changed files"""
    if not files_to_update:
        print("No files to update")
        return

    # Filter documents to only include files that need updating
    docs_to_update = [
        doc for doc in docs if doc.metadata.get("file_name") in files_to_update
    ]

    if not docs_to_update:
        print("No documents to process")
        return

    print(
        f"Processing {len(docs_to_update)} documents from {len(files_to_update)} files..."
    )

    # Split documents
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    splits = text_splitter.split_documents(docs_to_update)

    print(f"Created {len(splits)} chunks")

    # Delete old versions of updated files
    for file_name in files_to_update:
        try:
            index.delete(filter={"file_name": {"$eq": file_name}}, namespace=namespace)
        except Exception as e:
            print(f"Error deleting old version of {file_name}: {e}")

    # Prepare records for Pinecone
    records = []
    for i, doc in enumerate(splits):
        unique_id = f"{doc.metadata.get('file_name', 'doc')}_{i}"
        record = {
            "_id": unique_id,
            "text": doc.page_content,
            "document_type": doc.metadata.get("document_type", ""),
            "category": doc.metadata.get("category", ""),
            "file_name": doc.metadata.get("file_name", ""),
            "file_path": doc.metadata.get("file_path", ""),
            "content_hash": doc.metadata.get("content_hash", ""),
        }
        records.append(record)

    # Upsert in batches
    batch_size = 96
    for batch_start in range(0, len(records), batch_size):
        batch_records = records[batch_start : batch_start + batch_size]
        try:
            index.upsert_records(namespace=namespace, records=batch_records)
            print(
                f"  - Upserted batch {batch_start // batch_size + 1}/{(len(records) + batch_size - 1) // batch_size}"
            )
        except Exception as e:
            print(f"Error upserting batch: {e}")

    print("✓ Sync completed successfully")


def sync_to_pinecone(github_url, local_dir, namespace="__default__"):
    """Main sync function"""
    print("=" * 60)
    print("Starting Pinecone sync...")
    print("=" * 60)

    # Get existing files from Pinecone
    existing_files = get_existing_files_from_pinecone(namespace)

    # Load current files from repository
    docs, current_files = clone_and_load_repo(github_url, local_dir)
    print(f"\nFound {len(current_files)} files in repository")

    # Delete removed files
    print("\nChecking for deleted files...")
    delete_removed_files(existing_files, current_files, namespace)

    # Identify files to update
    print("\nChecking for new or modified files...")
    files_to_update = get_files_to_update(existing_files, current_files)

    # Update Pinecone
    print(f"\nUpdating Pinecone with {len(files_to_update)} files...")
    save_vector_store(docs, files_to_update, namespace)

    print("\n" + "=" * 60)
    print("Sync completed!")
    print("=" * 60)


if __name__ == "__main__":
    sync_to_pinecone(
        github_url="https://github.com/zeerafle/zeerafle.github.io",
        local_dir="./github_data",
    )
