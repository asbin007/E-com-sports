import CrudPage from '@/components/CrudPage';

export default function Brands() {
  return (
    <CrudPage
      title="Brands"
      endpoint="/brands"
      fields={[
        { key: 'name', label: 'Brand Name', required: true },
        { key: 'logo', label: 'Logo URL (optional)' },
      ]}
    />
  );
}
