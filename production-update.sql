-- Production Database Update Script
-- Add INVITE_USER feature to Free plan

-- First, get the Free plan ID and INVITE_USER feature ID
-- Then insert the mapping if it doesn't already exist

INSERT INTO plan_feature_mappings (plan_id, feature_id)
SELECT
    p.id as plan_id,
    f.id as feature_id
FROM plans p
CROSS JOIN features f
WHERE p.name = 'Free'
  AND f.code = 'INVITE_USER'
  AND NOT EXISTS (
    SELECT 1 FROM plan_feature_mappings pfm
    WHERE pfm.plan_id = p.id AND pfm.feature_id = f.id
  );

-- Verify the update
SELECT
    p.name as plan_name,
    f.code as feature_code
FROM plans p
JOIN plan_feature_mappings pfm ON p.id = pfm.plan_id
JOIN features f ON pfm.feature_id = f.id
WHERE p.name = 'Free'
ORDER BY f.code;