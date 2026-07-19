import ExcelJS from "exceljs";

import type { ExportConfiguration } from "./exportTypes";

export const exportExcelBuilder = {

    async export<RowType>(

        configuration: ExportConfiguration<RowType>,

        selectedColumns: string[],

    ) {

        const {

            dataset,

            getCellValue,

        } = configuration;

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Indus Placement Nexus";

        workbook.created = new Date();

        const sheet = workbook.addWorksheet(

            dataset.sheetName,

        );

        const totalColumns = Math.max(

            selectedColumns.length,

            1,

        );

        sheet.mergeCells(

            1,

            1,

            1,

            totalColumns,

        );

        sheet.mergeCells(

            2,

            1,

            2,

            totalColumns,

        );

        const titleCell = sheet.getCell("A1");

        titleCell.value = "INDUS UNIVERSITY";

        titleCell.font = {

            bold: true,

            size: 18,

            color: {

                argb: "FFFFFFFF",

            },

        };

        titleCell.alignment = {

            horizontal: "center",

            vertical: "middle",

        };

        titleCell.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {

                argb: "FF1E3A8A",

            },

        };

        const subtitleCell = sheet.getCell("A2");

        subtitleCell.value = dataset.title;

        subtitleCell.font = {

            bold: true,

            size: 14,

            color: {

                argb: "FFFFFFFF",

            },

        };

        subtitleCell.alignment = {

            horizontal: "center",

            vertical: "middle",

        };

        subtitleCell.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {

                argb: "FF2563EB",

            },

        };

        sheet.getRow(1).height = 30;

        sheet.getRow(2).height = 24;

        sheet.getRow(3).height = 22;

        const header = sheet.getRow(3);

        header.values = selectedColumns;

        header.eachCell((cell) => {

            cell.font = {

                bold: true,

            };

            cell.alignment = {

                horizontal: "center",

                vertical: "middle",

            };

            cell.fill = {

                type: "pattern",

                pattern: "solid",

                fgColor: {

                    argb: "FFDDEBF7",

                },

            };

        });

        let excelRowIndex = 4;

        dataset.rows.forEach((row) => {

            const values: ExcelJS.CellValue[] = selectedColumns.map(

                (column) =>

                    getCellValue(

                        row,

                        column,

                    ) as ExcelJS.CellValue,

            );

           const excelRow = sheet.getRow(

    excelRowIndex++,

);

if (excelRow.number % 2 === 0) {

    excelRow.eachCell((cell) => {

        cell.fill = {

            type: "pattern",

            pattern: "solid",

            fgColor: {

                argb: "FFF8FAFC",

            },

        };

    });

}

excelRow.values = values;

excelRow.eachCell((cell) => {

    const style =

        configuration.getCellStyle?.(

            cell.value,

        );

    if (!style) {

        return;

    }

    cell.alignment = {

        vertical: "top",

        wrapText: style.wrapText,

    };

    if (style.hyperlink) {

        cell.value = {

            text: style.hyperlink,

            hyperlink: style.hyperlink,

        };

        cell.font = {

            color: {

                argb: "FF0563C1",

            },

            underline: true,

        };

    }

});

excelRow.height = 24;
        });

        sheet.columns.forEach((column) => {

            let max = 15;

            column.eachCell?.(

                {

                    includeEmpty: true,

                },

                (cell) => {

                    const length = String(

                        cell.value ?? "",

                    ).length;

                    if (length > max) {

                        max = length;

                    }

                },

            );

            column.width = Math.min(

                max + 4,

                60,

            );

        });

        sheet.views = [

            {

                state: "frozen",

                ySplit: 3,

            },

        ];

        sheet.autoFilter = {

            from: "A3",

            to: `${String.fromCharCode(

                64 + selectedColumns.length,

            )}3`,

        };

        sheet.eachRow((row) => {

            row.eachCell((cell) => {

                cell.border = {

                    top: {

                        style: "thin",

                    },

                    left: {

                        style: "thin",

                    },

                    right: {

                        style: "thin",

                    },

                    bottom: {

                        style: "thin",

                    },

                };

            });

        });

        const buffer =

            await workbook.xlsx.writeBuffer();

        const blob = new Blob(

            [buffer],

            {

                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

            },

        );

        const url =

            URL.createObjectURL(blob);

        const link =

            document.createElement("a");

        link.href = url;

        link.download = dataset.filename;

        document.body.appendChild(link);

        link.click();

        link.remove();

        URL.revokeObjectURL(url);

    },

};