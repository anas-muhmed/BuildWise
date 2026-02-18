// mongo-init.js
// MongoDB initialization script
// Runs automatically when MongoDB container starts for the first time

db = db.getSiblingDB('buildwise');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
          description: 'Must be a valid email address'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'Must be at least 6 characters (should be hashed)'
        },
        name: {
          bsonType: 'string',
          minLength: 2,
          description: 'Must be at least 2 characters'
        },
        role: {
          enum: ['student', 'teacher', 'admin', 'guest'],
          description: 'Must be one of the allowed roles'
        }
      }
    }
  }
});

// Create indexes for performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ created_at: -1 });

// Create projects collection
db.createCollection('projects');
db.projects.createIndex({ userId: 1, created_at: -1 });
db.projects.createIndex({ title: 'text' });

// Create student projects collection
db.createCollection('studentprojects');
db.studentprojects.createIndex({ userId: 1 });

// Create snapshots collection
db.createCollection('snapshots');
db.snapshots.createIndex({ projectId: 1, version: -1 });

print('✅ MongoDB initialized successfully!');
print('✅ Collections created: users, projects, studentprojects, snapshots');
print('✅ Indexes created for optimal performance');
