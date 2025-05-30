import FormulairePage from '../component/donation/FormulairePage';

export const metadata = {
  title: 'Donation & Shelter Form',
  description: 'Help animals in need by donating or providing shelter',
};

export default function DonationPage() {
  return (
    <main>
      <FormulairePage />
    </main>
  );
}