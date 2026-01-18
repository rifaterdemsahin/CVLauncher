# PDF Generation Process

This document explains the process for generating PDF versions of the CVs from the markdown files located in the `5_Symbols/cvs` directory.

The primary tool used for this conversion is `pandoc`, a universal document converter. `pandoc` can convert markdown files to a wide variety of formats, including PDF.

## Steps for PDF Generation

1.  **Install `pandoc`**: If not already installed, `pandoc` can be installed using Homebrew on macOS:
    ```bash
    brew install pandoc
    ```

2.  **Install a LaTeX Distribution**: To create PDF files, `pandoc` requires a LaTeX engine. `pdflatex` is a common choice. A full LaTeX distribution can be installed, such as MacTeX. A lightweight version without the GUI can be installed using Homebrew:
    ```bash
    brew install --cask mactex-no-gui
    ```
    This provides the `pdflatex` engine that `pandoc` uses by default.

3.  **Run the Conversion Script**: With `pandoc` and a LaTeX engine installed, the following shell command can be used to convert all markdown files in the `5_Symbols/cvs` directory to PDF:
    ```bash
    for f in 5_Symbols/cvs/*.md; do
      pandoc "$f" -s -o "${f%.md}.pdf"
    done
    ```

## Issues Encountered

During the execution of this process, the following issues were encountered:

1.  **`pandoc: command not found`**: This was resolved by installing `pandoc` using Homebrew.
2.  **`pdflatex not found`**: This error occurred because a LaTeX engine was not installed. Although an attempt was made to install `mactex-no-gui`, the `pdflatex` executable was not found in the system's PATH. This prevented the successful generation of the PDF files.

Once the LaTeX installation issue is resolved, the conversion script should run successfully and generate the PDF files.
