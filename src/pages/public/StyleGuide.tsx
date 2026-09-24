/**
 * StyleGuide (Unified into Editorial Policy & House Style Guide)
 * 
 * Re-exports the unified EditorialPolicy component with defaultTab="style".
 */

import EditorialPolicy, { EDITORIAL_APPROVAL_PRINCIPLES } from "./EditorialPolicy";

export { EDITORIAL_APPROVAL_PRINCIPLES };

export default function StyleGuide() {
  return <EditorialPolicy defaultTab="style" />;
}