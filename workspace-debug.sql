-- Get all workspaces with their IDs and helper counts
SELECT 
    w.id as workspace_id,
    w.slug,
    w.name,
    COUNT(h.id) as helper_count
FROM workspaces w
LEFT JOIN helpers h ON w.id = h."workspaceId" AND h."isActive" = true
GROUP BY w.id, w.slug, w.name
ORDER BY w."createdAt";