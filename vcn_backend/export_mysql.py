import pymysql
import os

conn = pymysql.connect(host='127.0.0.1', user='root', password='', database='syloc_t', port=3306)
cursor = conn.cursor()
cursor.execute('SHOW TABLES;')
tables = [row[0] for row in cursor.fetchall()]

out_path = 'syloc_t.sql'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write('-- Dump SQL Base SyLOC-T (CROUS-T / Senegal God Mode)\n')
    f.write('SET FOREIGN_KEY_CHECKS=0;\n\n')
    for table in tables:
        cursor.execute(f'SHOW CREATE TABLE `{table}`;')
        create_sql = cursor.fetchone()[1]
        f.write(f'DROP TABLE IF EXISTS `{table}`;\n')
        f.write(f'{create_sql};\n\n')
        
        cursor.execute(f'SELECT * FROM `{table}`;')
        rows = cursor.fetchall()
        if rows:
            cursor.execute(f'DESCRIBE `{table}`;')
            cols = [f'`{col[0]}`' for col in cursor.fetchall()]
            cols_str = ', '.join(cols)
            for row in rows:
                vals = []
                for val in row:
                    if val is None:
                        vals.append('NULL')
                    elif isinstance(val, (int, float)):
                        vals.append(str(val))
                    else:
                        val_str = str(val).replace("'", "''").replace('\\', '\\\\')
                        vals.append(f"'{val_str}'")
                f.write(f"INSERT INTO `{table}` ({cols_str}) VALUES ({', '.join(vals)});\n")
            f.write('\n')
    f.write('SET FOREIGN_KEY_CHECKS=1;\n')

conn.close()
print(f'Export {out_path} généré avec succès ({len(tables)} tables).')
