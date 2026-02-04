import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
	return {
		redirect: {
			destination: '/artists/profile',
			permanent: false,
		},
	};
};

export default function ArtistIndexRedirect() {
	return null;
}
