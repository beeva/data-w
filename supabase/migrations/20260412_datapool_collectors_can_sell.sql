-- Allow collectors to create, update, and delete their own Data Pool listings and files.

DROP POLICY IF EXISTS "datapool_datasets_insert_personal_company" ON public.datapool_datasets;
DROP POLICY IF EXISTS "datapool_datasets_update_own_personal_company" ON public.datapool_datasets;
DROP POLICY IF EXISTS "datapool_datasets_delete_own_personal_company" ON public.datapool_datasets;

CREATE POLICY "datapool_datasets_insert_seller_roles"
  ON public.datapool_datasets FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN (
          'personal'::public.user_role,
          'company'::public.user_role,
          'collector'::public.user_role
        )
    )
  );

CREATE POLICY "datapool_datasets_update_own_seller_roles"
  ON public.datapool_datasets FOR UPDATE
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN (
          'personal'::public.user_role,
          'company'::public.user_role,
          'collector'::public.user_role
        )
    )
  );

CREATE POLICY "datapool_datasets_delete_own_seller_roles"
  ON public.datapool_datasets FOR DELETE
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN (
          'personal'::public.user_role,
          'company'::public.user_role,
          'collector'::public.user_role
        )
    )
  );

DROP POLICY IF EXISTS "datapool_dataset_files_insert_owner_personal_company" ON public.datapool_dataset_files;
DROP POLICY IF EXISTS "datapool_dataset_files_delete_owner_personal_company" ON public.datapool_dataset_files;

CREATE POLICY "datapool_dataset_files_insert_owner_seller_roles"
  ON public.datapool_dataset_files FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN (
          'personal'::public.user_role,
          'company'::public.user_role,
          'collector'::public.user_role
        )
    )
    AND EXISTS (
      SELECT 1
      FROM public.datapool_datasets d
      WHERE d.id = datapool_dataset_files.dataset_id
        AND d.owner_id = auth.uid()
    )
  );

CREATE POLICY "datapool_dataset_files_delete_owner_seller_roles"
  ON public.datapool_dataset_files FOR DELETE
  USING (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN (
          'personal'::public.user_role,
          'company'::public.user_role,
          'collector'::public.user_role
        )
    )
  );
