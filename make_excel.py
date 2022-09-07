import pandas as pd
import os

# # Create a Pandas dataframe from the data.
# df = pd.DataFrame({'Data': [10, 20, 30, 20, 15, 30, 45]})

# # Create a Pandas Excel writer using XlsxWriter as the engine.
# writer = pd.ExcelWriter('pandas_simple.xlsx', engine='xlsxwriter')

# # Convert the dataframe to an XlsxWriter Excel object.
# df.to_excel(writer, sheet_name='Sheet1')

# # Get the xlsxwriter objects from the dataframe writer object.
# workbook  = writer.book
# worksheet = writer.sheets['Sheet1']

if not os.path.exists("sheets/"):
    os.mkdir("sheets/")

for year in os.listdir("out/"):
    year = int(year)
    out_path = f"out/{year}/"

    writer = pd.ExcelWriter(f'sheets/{year}.xlsx', engine='xlsxwriter')

    for tsv in sorted(os.listdir(out_path)):
        full_path = f"{out_path}{tsv}"
        df = pd.read_csv(full_path, delimiter="\t", index_col=0)

        worksheet_name = tsv.replace(".tsv", "")

        if len(worksheet_name) > 31:
            worksheet_name = worksheet_name[:31]

        df.to_excel(writer, sheet_name=worksheet_name)

    writer.save()