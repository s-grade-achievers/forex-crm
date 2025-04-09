#!/bin/sh

/opt/mssql/bin/sqlservr &

pid=$!

echo "Waiting for SQL Server to be available..."

until /opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -N -C -Q "SELECT 1" > /dev/null 2>&1
do
  echo "Still waiting for SQL Server..."
  sleep 2
done

echo "SQL Server is ready. Running init script..."

/opt/mssql-tools18/bin/sqlcmd -S localhost -U SA -P "$SA_PASSWORD" -N -C -i /db/init.sql

wait $pid
