import AdminLayout from "../../components/AdminLayout"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return <AdminLayout>{children}</AdminLayout>
}