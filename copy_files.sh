#!/bin/bash

# Check if the directory contains a .gitignore file
if [ ! -f .gitignore ]; then
    echo "No .gitignore file found in the current directory!"
    exit 1
fi

# Create/overwrite the code.txt file
> code.txt

# Use git to list all files not ignored by .gitignore
git ls-files | while read file; do
    # Skip yarn.lock and yarn-error.log files
    if [[ "$file" == "yarn.lock" ]] || [[ "$file" == "yarn-error.log" ]]; then
        continue
    fi

    # Write the filepath to code.txt
    echo "===== FILE: $file =====" >> code.txt
    # Append the content of the file to code.txt
    cat "$file" >> code.txt
    # Add a separator for clarity
    echo -e "\n\n" >> code.txt
done

echo "Contents copied to code.txt"
