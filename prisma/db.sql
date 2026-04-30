-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- 1. PLANS
-- =========================
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price FLOAT DEFAULT 0,
    max_uploads_per_week INT DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 2. USERS & ADMINS
-- =========================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    plan_uuid UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_plan
        FOREIGN KEY (plan_uuid)
        REFERENCES plans(uuid)
        ON DELETE SET NULL
);

CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 3. VIDEO UPLOADS
-- =========================
CREATE TABLE video_uploads (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_uuid UUID NOT NULL,
    s3_video_uuid TEXT NOT NULL,
    name TEXT,
    size BIGINT,
    duration FLOAT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_video_user
        FOREIGN KEY (user_uuid)
        REFERENCES users(uuid)
        ON DELETE CASCADE
);

-- =========================
-- 4. VMs
-- =========================
CREATE TABLE vms (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    cores INT NOT NULL,
    rams INT NOT NULL,
    cost FLOAT NOT NULL,
    status TEXT DEFAULT 'Idle' CHECK (
        status IN ('Dispatched', 'Idle', 'Running', 'Paused')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 5. BATCHES
-- =========================
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    vm_uuid UUID,
    status TEXT CHECK (
        status IN ('Pending', 'Running', 'Interrupted', 'FullyFinished', 'PartiallyFinished')
    ),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_batch_vm
        FOREIGN KEY (vm_uuid)
        REFERENCES vms(uuid)
        ON DELETE SET NULL
);

-- =========================
-- 6. PROCESSES
-- =========================
CREATE TABLE processes (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    user_uuid UUID NOT NULL,
    video_uuid UUID NOT NULL,
    quality TEXT,
    fps INT,
    duration FLOAT,
    batch_uuid UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_process_user
        FOREIGN KEY (user_uuid)
        REFERENCES users(uuid)
        ON DELETE CASCADE,

    CONSTRAINT fk_process_video
        FOREIGN KEY (video_uuid)
        REFERENCES video_uploads(uuid)
        ON DELETE CASCADE,

    CONSTRAINT fk_process_batch
        FOREIGN KEY (batch_uuid)
        REFERENCES batches(uuid)
        ON DELETE SET NULL
);

-- =========================
-- 7. PROCESS HISTORY
-- =========================
CREATE TABLE process_history (
    id SERIAL PRIMARY KEY,
    process_uuid UUID NOT NULL,
    status TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_process_history
        FOREIGN KEY (process_uuid)
        REFERENCES processes(uuid)
        ON DELETE CASCADE
);

-- =========================
-- 8. BATCH PROCESSES
-- =========================
CREATE TABLE batch_processes (
    id SERIAL PRIMARY KEY,
    batch_uuid UUID NOT NULL,
    process_uuid UUID NOT NULL,
    process_status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bp_batch
        FOREIGN KEY (batch_uuid)
        REFERENCES batches(uuid)
        ON DELETE CASCADE,

    CONSTRAINT fk_bp_process
        FOREIGN KEY (process_uuid)
        REFERENCES processes(uuid)
        ON DELETE CASCADE
);

-- =========================
-- 9. VM HISTORY
-- =========================
CREATE TABLE vm_history (
    id SERIAL PRIMARY KEY,
    vm_uuid UUID NOT NULL,
    batch_uuid UUID,
    duration FLOAT,
    cost FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_vm_history_vm
        FOREIGN KEY (vm_uuid)
        REFERENCES vms(uuid)
        ON DELETE CASCADE,

    CONSTRAINT fk_vm_history_batch
        FOREIGN KEY (batch_uuid)
        REFERENCES batches(uuid)
        ON DELETE SET NULL
);

-- =========================
-- INDEXES (IMPORTANT)
-- =========================
CREATE INDEX idx_users_uuid ON users(uuid);
CREATE INDEX idx_videos_user_uuid ON video_uploads(user_uuid);
CREATE INDEX idx_process_user_uuid ON processes(user_uuid);
CREATE INDEX idx_process_batch_uuid ON processes(batch_uuid);
CREATE INDEX idx_batch_vm_uuid ON batches(vm_uuid);
CREATE INDEX idx_vm_status ON vms(status);