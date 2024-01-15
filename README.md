# Minimal Mistakes remote theme starter

Click [**Use this template**](https://github.com/mmistakes/mm-github-pages-starter/generate) button above for the
quickest method of getting started with
the [Minimal Mistakes Jekyll theme](https://github.com/mmistakes/minimal-mistakes).

Contains basic configuration to get you a site with:

- Sample posts.
- Sample top navigation.
- Sample author sidebar with social links.
- Sample footer links.
- Paginated home page.
- Archive pages for posts grouped by year, category, and tag.
- Sample about page.
- Sample 404 page.
- Site wide search.

Replace sample content with your own
and [configure as necessary](https://mmistakes.github.io/minimal-mistakes/docs/configuration/).

---

## Troubleshooting

If you have a question about using Jekyll, start a discussion on the [Jekyll Forum](https://talk.jekyllrb.com/)
or [StackOverflow](https://stackoverflow.com/questions/tagged/jekyll). Other resources:

- [Ruby 101](https://jekyllrb.com/docs/ruby-101/)
- [Setting up a Jekyll site with GitHub Pages](https://jekyllrb.com/docs/github-pages/)
- [Configuring GitHub Metadata](https://github.com/jekyll/github-metadata/blob/master/docs/configuration.md#configuration)
  to work properly when developing locally and
  avoid `No GitHub API authentication could be found. Some fields may be missing or have incorrect data.` warnings.

## Local Installation

1. Install rbenv
    ```bash
    sudo apt install rbenv
    ```
2. Install ruby-build as plugin
    ```bash
    git clone https://github.com/rbenv/ruby-build.git "$(rbenv root)"/plugins/ruby-build
   ```
3. Install ruby 3.1.2 with rbenv
    ```bash
    rbenv install 3.1.2
    ```
4. Set ruby 3.1.2 as global ruby
    ```bash
    rbenv global 3.1.2
    ```
5. Install bundler
    ```bash
    gem install bundler
    ```
6. Install dependencies
    ```bash
    bundle install
    ```
7. Run jekyll
    ```bash
    bundle exec jekyll serve -l
    ``` 
