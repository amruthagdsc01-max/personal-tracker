/** Download the whole app state as a JSON file the user can keep or restore later. */
export function downloadBackup(state, date) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: `ezze-backup-${date}.json` }).click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
