import CrudPage from '@/components/CrudPage';

export default function Sports() {
  return (
    <CrudPage
      title="Sports"
      endpoint="/sports"
      fields={[
        { key: 'name', label: 'Sport Name', required: true },
      ]}
    />
  );
}
