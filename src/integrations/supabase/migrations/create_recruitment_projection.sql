-- ============================================================
-- Recruitment Projection
-- Operational Read Model
-- One row per published recruitment (drive)
-- ============================================================

CREATE TABLE public.recruitment_projection
(
    drive_id uuid PRIMARY KEY
        REFERENCES drive_master(drive_id)
        ON DELETE CASCADE,

    --------------------------------------------------------
    -- Shared operational metrics
    --------------------------------------------------------

    eligible_students integer NOT NULL DEFAULT 0,

    registered_students integer NOT NULL DEFAULT 0,

    total_applications integer NOT NULL DEFAULT 0,

    present_students integer NOT NULL DEFAULT 0,

    absent_students integer NOT NULL DEFAULT 0,

    shortlisted_students integer NOT NULL DEFAULT 0,

    interviewed_students integer NOT NULL DEFAULT 0,

    selected_students integer NOT NULL DEFAULT 0,

    rejected_students integer NOT NULL DEFAULT 0,

    --------------------------------------------------------
    -- Projection lifecycle
    --------------------------------------------------------

    projection_locked boolean NOT NULL DEFAULT false,

    initialized_at timestamptz NOT NULL DEFAULT now(),

    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_recruitment_projection_locked
ON recruitment_projection(projection_locked);

CREATE INDEX idx_recruitment_projection_updated
ON recruitment_projection(updated_at);

CREATE TRIGGER trg_recruitment_projection_updated_at
BEFORE UPDATE
ON recruitment_projection
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE recruitment_projection
ENABLE ROW LEVEL SECURITY;

CREATE POLICY recruitment_projection_all
ON recruitment_projection
FOR ALL
TO public
USING (true)
WITH CHECK (true);

COMMENT ON TABLE recruitment_projection IS
'Operational recruitment projection used by Register, Dashboard, Analytics, Summary and Export. Not a business source of truth.';

COMMENT ON COLUMN recruitment_projection.projection_locked IS
'Once finalize_recruitment_execution() completes this projection becomes immutable.';

INSERT INTO recruitment_projection
(
    drive_id
)
SELECT drive_id
FROM drive_master
ON CONFLICT (drive_id)
DO NOTHING;