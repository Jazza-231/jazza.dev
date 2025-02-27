import csv
import json
import os


def convert_csv_to_json(input_file, output_file):
    # Dictionary to store the converted data
    output_data = {}

    # Read the CSV file
    with open(input_file, "r", encoding="utf-8") as csvfile:
        # Skip the header row
        next(csvfile)

        # Create CSV reader
        csvreader = csv.reader(csvfile)

        # Process each row
        for row in csvreader:
            # Ensure row has at least 3 columns
            # ID, Image Name, Alt (column names dont matter)
            if len(row) >= 3:
                # Use Image_ID as key and create a dictionary with 'alt' key
                output_data[row[1]] = {"alt": row[2]}

    # Write to JSON file
    with open(output_file, "w", encoding="utf-8") as jsonfile:
        json.dump(output_data, jsonfile, indent=2, ensure_ascii=False)

    print(f"Conversion complete. JSON saved to {output_file}")


# Specific file paths
# input_file = r"C:\Users\green\Downloads\All image captions.csv"
# output_file = r"C:\Users\green\Downloads\sorted_screenshots.json"

input_file = input("Enter the path to the input file: ").strip('"')
output_file = os.path.join(
    os.path.dirname(input_file), os.path.basename(input_file).replace(".csv", ".json")
)

# Run the conversion
convert_csv_to_json(input_file, output_file)
