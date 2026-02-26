-- Add collector-configurable access fields for submitted files.
ALTER TABLE data_items
  ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2);

-- Allow collectors to update visibility/price on their own submissions' files.
DROP POLICY IF EXISTS "Collectors can update data items for their submissions" ON data_items;
CREATE POLICY "Collectors can update data items for their submissions"
  ON data_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = data_items.submission_id
      AND submissions.collector_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM submissions
      WHERE submissions.id = data_items.submission_id
      AND submissions.collector_id = auth.uid()
    )
  );
