#!/bin/bash

/opt/mssql-tools18/bin/sqlcmd -S localhost -l 60 -U SA -P "$SA_PASSWORD" -N -C -i /db/init.sql &
/opt/mssql/bin/sqlservr