import { AuthProvider } from '../../lib/auth';
import BlogInteractions from './BlogInteractions';

export default function BlogInteractionsWrapper(props) {
  return (
    <AuthProvider>
      <BlogInteractions {...props} />
    </AuthProvider>
  );
}
