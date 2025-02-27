import json
import os


def merge_json_files(file1_path, file2_path):
    """
    Merge two JSON files, with file2's content taking precedence in case of conflicts,
    and write the result back to file1.

    Args:
        file1_path (str): Path to the first JSON file (target)
        file2_path (str): Path to the second JSON file (source)
    """
    # Clean up file paths (remove quotes and extra spaces that might come from drag and drop)
    file1_path = file1_path.strip().strip('"').strip("'")
    file2_path = file2_path.strip().strip('"').strip("'")

    # Check if files exist
    if not os.path.exists(file1_path):
        print(f"Error: First file not found: {file1_path}")
        return
    if not os.path.exists(file2_path):
        print(f"Error: Second file not found: {file2_path}")
        return

    # Load the JSON data from both files
    try:
        with open(file1_path, "r") as file1:
            data1 = json.load(file1)
    except json.JSONDecodeError:
        print(f"Error: {file1_path} is not a valid JSON file.")
        return

    try:
        with open(file2_path, "r") as file2:
            data2 = json.load(file2)
    except json.JSONDecodeError:
        print(f"Error: {file2_path} is not a valid JSON file.")
        return

    # Merge the two dictionaries
    # This will add all keys from data2 to data1,
    # and for keys that exist in both, data2's values will take precedence
    merged_data = {**data1, **data2}

    # Write the merged data back to the first file
    try:
        with open(file1_path, "w") as outfile:
            json.dump(merged_data, outfile, indent=3)
        print(f"Successfully merged {file2_path} into {file1_path}")
    except Exception as e:
        print(f"Error writing to {file1_path}: {e}")

    # Keep console window open after execution (for Windows users)
    input("\nPress Enter to exit...")


if __name__ == "__main__":
    print("JSON File Merger")
    print("---------------")
    print("Drag and drop or paste the file paths below:")

    # Get input for file paths
    file1_path = input("Path to first JSON file (target): ")
    file2_path = input("Path to second JSON file (source): ")

    # Call the merge function with the provided file paths
    merge_json_files(file1_path, file2_path)
