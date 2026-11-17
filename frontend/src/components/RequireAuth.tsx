import { useState, type CSSProperties, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import Header from "./Header.tsx";
import { hasRole, useSession, type Role } from "../auth.ts";

const forbiddenStyles: CSSProperties = {
  marginTop: "var(--header-height)",
  padding: "2rem",
  textAlign: "center",
};

type Props = { roles?: Role[]; children: ReactNode };

// Only lets in logged-in users (with one of `roles`, if given); others go to the login
// page, which sends them back here afterwards. The server still checks every request.
export default function RequireAuth({ roles, children }: Props) {
  const session = useSession();
  const location = useLocation();
  // If the session ends while someone is filling in a checklist, stay on the page
  // so nothing typed is lost; the next request reports the expiry
  const [arrivedWith] = useState(session);
  const user = session ?? arrivedWith;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!hasRole(user, roles)) {
    return (
      <div>
        <Header />
        <div style={forbiddenStyles}>
          <h2>Access denied</h2>
          <p>Your account ({user.role}) can't open this page.</p>
        </div>
      </div>
    );
  }
  return children;
}
