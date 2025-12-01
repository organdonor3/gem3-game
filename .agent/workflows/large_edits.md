---
description: Guidelines for safely editing large files or making extensive changes
---

# Large Edit Safety Protocol

To prevent syntax errors and file corruption when making significant changes:

1.  **Threshold**: If you are modifying more than **100 lines** of code, or if the changes involve complex nesting/structural updates (e.g., React components with many hooks and render blocks).
2.  **Action**: Do **NOT** use `replace_file_content` or `multi_replace_file_content`.
3.  **Procedure**:
    *   Read the current file content using `view_file` to ensure you have the latest version.
    *   Construct the *entire* new file content locally.
    *   Use `write_to_file` with `Overwrite: true` to replace the file completely.
4.  **Verification**: Always run a build or syntax check immediately after a full rewrite.
