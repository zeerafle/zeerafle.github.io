---
title: Identifikasi Masalah dalam Penelitian
mermaid: true
---

## Identifikasi masalah

Identifikasi masalah merupakan <mark>inti dari penelitian</mark> itu sendiri.

Perumusan masalah:
1. Identifikasi masalah
2. Pembatasan masalah. Jika terlalu luas akan berpengaruh pada waktu dan biaya 
3. Penetapan research question. Tidak harus ada. contoh lihat di halaman 31
4. Identifikasi tujuan

Barulah membentuk hipotesis. Bisa statistikal atau pernyataan.

<script type="module"> import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10.0.0/+esm' </script>

<div class="mermaid">
flowchart TD
    subgraph TITLE[Perumusan Masalah]
    A[Identifikasi Masalah]-->B[Pembatasan Ruang Lingkup]
    B-->C[Penetapan Research Question]
    C-->D[Identifkasi Tujuan]
    end
    TITLE --> E[Hipotesis]
    E-->F[Statistical Hipotesis]
    E-->G[Hypothetical Statement]
</div>

Problem didapat dari:
1. Penelitian observasi. Datang dari masalah yang nyata di lapangan
2. Diskusi
3. Dosen-dosen ahli riset
4. Bibliographi

Penelitian di informatika tidak harus menghasilkan hipotesis.

## Langkah-langkah Perumusan Masalah

<div class="mermaid">
flowchart TB
    A[Penetapan permasalahan penelitian]-->B[Hipotesis]
    B<-->E[Variabel]
    B<-->F[Definisi operasional]
    B<-->G[Kondisi]

    A-.-C[Teori yang relevan]
    A-.-D[Pengetahuan]

    C-.-E
    E-.-F
    F-.-G
    G-.-D
</div>
