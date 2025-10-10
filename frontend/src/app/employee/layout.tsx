import EmployeeLayout from "@/components/EmployeeLayout"

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return <EmployeeLayout>{children}</EmployeeLayout>
}