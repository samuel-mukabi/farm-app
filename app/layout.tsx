import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/app/components/ClientLayout";

export const metadata: Metadata = {
    title: "Samuel's Farm Application",
    description: "Premium Farm Management System",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased">
                <ClientLayout>{children}</ClientLayout>
            </body>
        </html>
    );
}