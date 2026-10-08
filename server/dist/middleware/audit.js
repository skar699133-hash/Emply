import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/connection.js';
export async function logAudit(params) {
    try {
        const id = `aud-${uuidv4()}`;
        await db.query(`INSERT INTO audit_logs (id, actor_id, actor_name, actor_role, ip_address, action, entity_type, entity_id, previous_state, new_state, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [
            id,
            params.actorId || null,
            params.actorName,
            params.actorRole,
            params.ipAddress || '127.0.0.1',
            params.action,
            params.entityType,
            params.entityId,
            params.previousState ? JSON.stringify(params.previousState) : null,
            params.newState ? JSON.stringify(params.newState) : null,
            params.metadata ? JSON.stringify(params.metadata) : null,
        ]);
    }
    catch (error) {
        console.error('Failed to write audit log:', error);
    }
}
