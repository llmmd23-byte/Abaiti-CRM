USE sales1_system;

INSERT INTO educational_assets (title, asset_type, description, status)
SELECT 'Customer journey infographic', 'image', 'Educational slides', 'active'
WHERE NOT EXISTS (SELECT 1 FROM educational_assets WHERE title = 'Customer journey infographic');

INSERT INTO educational_assets (title, asset_type, description, status)
SELECT 'Customer qualification guide', 'image', 'Shareable design', 'active'
WHERE NOT EXISTS (SELECT 1 FROM educational_assets WHERE title = 'Customer qualification guide');

INSERT INTO educational_assets (title, asset_type, description, status)
SELECT 'Industry benefits comparison', 'image', 'Illustrated comparison', 'active'
WHERE NOT EXISTS (SELECT 1 FROM educational_assets WHERE title = 'Industry benefits comparison');

INSERT INTO educational_assets (title, asset_type, description, status)
SELECT 'System activation map', 'image', 'Educational slides', 'active'
WHERE NOT EXISTS (SELECT 1 FROM educational_assets WHERE title = 'System activation map');

INSERT INTO educational_assets (title, asset_type, duration, description, status)
SELECT 'Connecting customers to industries', 'video', '06:15', 'Middar workflow lesson', 'active'
WHERE NOT EXISTS (SELECT 1 FROM educational_assets WHERE title = 'Connecting customers to industries');

INSERT INTO educational_assets (title, asset_type, duration, description, status)
SELECT 'Preparing a customer demo', 'video', '05:05', 'Middar workflow lesson', 'active'
WHERE NOT EXISTS (SELECT 1 FROM educational_assets WHERE title = 'Preparing a customer demo');

INSERT INTO educational_assets (title, asset_type, duration, description, status)
SELECT 'Presentation and follow-up practices', 'video', '07:40', 'Middar workflow lesson', 'active'
WHERE NOT EXISTS (SELECT 1 FROM educational_assets WHERE title = 'Presentation and follow-up practices');
