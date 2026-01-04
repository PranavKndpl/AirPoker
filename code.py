import os

VALID_EXTENSIONS = (".ts", ".tsx")
OUTPUT_FILE = "ts_code_dump.txt"

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
EXCLUDE_DIRS = {"node_modules", ".git", "dist", "build"}


def find_matching_folders(root_dir, target_names):
    matches = []

    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Skip excluded directories
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]

        # Check if the current directory itself is a target
        if os.path.basename(dirpath) in target_names:
            matches.append(dirpath)

    return matches


def write_ts_files_from_folders(folders, output_file):
    written_files = set()

    with open(output_file, "w", encoding="utf-8") as out:
        for folder in folders:
            for dirpath, dirnames, filenames in os.walk(folder):
                dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]

                for filename in filenames:
                    if filename.endswith(VALID_EXTENSIONS):
                        file_path = os.path.join(dirpath, filename)

                        # Prevent duplicates if folders overlap
                        if file_path in written_files:
                            continue
                        written_files.add(file_path)

                        try:
                            with open(file_path, "r", encoding="utf-8") as f:
                                code = f.read()
                        except Exception as e:
                            print(f"Skipping {file_path}: {e}")
                            continue

                        out.write(f"{file_path}\n")
                        out.write("```\n")
                        out.write(code)
                        out.write("\n```\n\n")


if __name__ == "__main__":
    user_input = input(
        "Enter folder names (comma-separated, e.g. src,components): "
    )

    target_folders = [name.strip() for name in user_input.split(",") if name.strip()]

    if not target_folders:
        print("No folder names provided.")
        exit(1)

    matched_folders = find_matching_folders(ROOT_DIR, target_folders)

    if not matched_folders:
        print("No matching folders found.")
        exit(1)

    print("Found folders:")
    for folder in matched_folders:
        print(" -", folder)

    write_ts_files_from_folders(matched_folders, OUTPUT_FILE)

    print(f"\nDone! Code written to {OUTPUT_FILE}")
