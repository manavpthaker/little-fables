// Legacy buddy carousel — retired in v3.
// The drawn arrival (/read/arrival) replaced the emoji-card carousel. Kept
// as a redirect so any hardcoded link (bookmark, iOS home screen icon,
// legacy intent target) still lands in the right place.

import { redirect } from 'next/navigation'

export default function BuddyPage() {
  redirect('/read/arrival')
}
