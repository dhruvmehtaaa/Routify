# Local Setup Guide for Routify

Welcome to Routify! This guide will walk you through setting up the project locally on your machine.

## Prerequisites

Make sure you have the following installed:

- PostgreSQL
- PostGIS
- PgRouting
- GeoServer (Install on default port 8080)
- Leaflet JS (No Installation required)
- GDAL (ogr2ogr)

## Setup Steps

### Step 1: Create Database

Create a database with the required extensions:

```sql
CREATE DATABASE your_database_name;
CREATE EXTENSION postgis;
CREATE EXTENSION pgrouting;
```

### Step 2: Load Network Data

Run the following command in PowerShell in the correct directory where `new.geojson` is present:

```bash
ogr2ogr -select 'name,highway,oneway,surface' -lco GEOMETRY_NAME=the_geom -lco FID=id -f PostgreSQL PG:"dbname=your_database_name user=your_username password=your_password" -nln edges new.geojson
```

Replace `your_database_name`, `your_username`, and `your_password` with your database details.

### Step 3: Add Source and Target Columns

```sql
ALTER TABLE edges ADD source INT4;
ALTER TABLE edges ADD target INT4;
```

### Step 4: Split Nodes

```sql
SELECT pgr_nodeNetwork('edges', 0.00001);
```

### Step 5: Create Topology

```sql
SELECT pgr_createTopology('edges_noded', 0.00001);
```

### Step 6: Copy Attribute Information

```sql
ALTER TABLE edges_noded
 ADD COLUMN name VARCHAR,
 ADD COLUMN type VARCHAR;

UPDATE edges_noded AS new
 SET name=old.name, 
   type=old.highway 
FROM edges as old
WHERE new.old_id=old.id;
```

### Step 7: Determine Cost

```sql
ALTER TABLE edges_noded ADD distance FLOAT8;

UPDATE edges_noded SET distance = ST_Length(ST_Transform(the_geom, 4326)::geography) / 1000;
```

### Step 8: Test Shortest Path

```sql
SELECT * FROM pgr_dijkstra('SELECT id,source,target,distance as cost FROM edges_noded',1,2,false);
```

### Step 9: Publishing to GeoServer

On GeoServer:

- Create a new store and connect to PostGIS database.
- Create new layers to store `edges_noded` and `edges_noded_vertices_pgr`.
- Create 2 parameterized SQL Views in new layers: `nearest_vertex` and `shortest_path`. See instructions in the provided documentation.

### Step 10: Install CORS Plugin

Install the CORS Unblock plugin for your browser: [CORS Unblock](https://chromewebstore.google.com/detail/cors-unblock/lfhmikememgdcahcdlaciloancbhjino)

Make sure ad blockers are disabled on your browser.

Enable the plugin and access the frontend via [Routify](https://dhruvmehtaaa.github.io/Routify/index.html).



