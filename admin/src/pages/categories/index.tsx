import CrudPage from '@/components/CrudPage';

export default function Categories() {
  return (
    <CrudPage
      title="Categories"
      endpoint="/categories"
      fields={[
        { key: 'name', label: 'Category Name', required: true },
        {
          key: 'sizeType',
          label: 'Size Type',
          type: 'select',
          options: [
            { value: 'clothing', label: 'Clothing (S, M, L, XL, XXL)' },
            { value: 'shoe', label: 'Shoes (UK 6-12)' },
            { value: 'weight', label: 'Weight/Handle (Short, Long)' },
            { value: 'equipment', label: 'Equipment (One Size)' },
          ],
        },
        {
          key: 'needsSize',
          label: 'Requires Size',
          type: 'select',
          options: [
            { value: 'true', label: 'Yes' },
            { value: 'false', label: 'No' },
          ],
        },
      ]}
    />
  );
}
