import pandas as pd
import os

if not os.path.exists("sheets/"):
    os.mkdir("sheets/")

for year in os.listdir("out/"):
    year = int(year)
    out_path = f"out/{year}/"

    writer = pd.ExcelWriter(f'sheets/{year}.xlsx', engine='xlsxwriter')

    for tsv in sorted(os.listdir(out_path)):
        full_path = f"{out_path}{tsv}"
        df = pd.read_csv(
            full_path,
            delimiter="\t",
        )

        df.index += 1
        df.index.name = "Original Row"
        worksheet_name = tsv.replace(".tsv", "")

        if len(worksheet_name) > 31:
            worksheet_name = worksheet_name[:31]

        df.to_excel(writer, sheet_name=worksheet_name)

    writer.save()