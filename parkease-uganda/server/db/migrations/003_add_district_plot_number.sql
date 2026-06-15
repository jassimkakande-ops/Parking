-- 003_add_district_plot_number.sql

ALTER TABLE parking_facilities
ADD COLUMN district VARCHAR(255),
ADD COLUMN plot_number VARCHAR(255);
