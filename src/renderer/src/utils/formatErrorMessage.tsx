import React from 'react'

export function formatErrorMessage(rawError: string): React.ReactNode {
  let friendlyMessage = rawError

  if (rawError.includes('EACCES: permission denied') || rawError.includes('EPERM')) {
    friendlyMessage = 'Permission denied. The file or destination folder might be read-only.'
  } else if (rawError.includes('ENOENT: no such file or directory')) {
    friendlyMessage = 'File or destination folder could not be found.'
  } else if (rawError.includes('ENOSPC: no space left on device')) {
    friendlyMessage = 'Not enough disk space to move this file.'
  } else if (rawError.includes('EBUSY: resource busy or locked')) {
    friendlyMessage = 'The file is currently being used by another program.'
  } else if (rawError.includes('ENOTDIR: not a directory')) {
    friendlyMessage = 'The destination you selected is currently an existing file, not a folder.'
  } else if (rawError.includes('EEXIST: file already exists')) {
    friendlyMessage = 'A file or folder with this name already exists at the destination.'
  }

  // Extract paths from raw node rename error: "rename '/path/to/src' -> '/path/to/dest'"
  const renameMatch = rawError.match(/rename '(.*?)' -> '(.*?)'/)

  // Extract path from single path operations: "mkdir '/path/to/dest'", "scandir '/path'", etc.
  const singlePathMatch = rawError.match(/(?:mkdir|scandir|stat|access|open|read) '(.*?)'/)

  if (renameMatch) {
    const srcParts = renameMatch[1].split(/[\\/]/)
    const destParts = renameMatch[2].split(/[\\/]/)
    const srcFileName = srcParts[srcParts.length - 1]
    const destFolderName = destParts[destParts.length - 2]

    return (
      <div className="flex flex-col gap-2 mt-1">
        <span>{friendlyMessage}</span>
        <div className="bg-red-50/50 p-2.5 rounded border border-red-100/50 mt-1 space-y-1.5 text-left text-[11px] text-red-700/80">
          <div className="flex items-start gap-1">
            <span className="shrink-0 leading-tight">↳</span>
            <div>
              Could not move <strong>{srcFileName}</strong> into the{' '}
              <strong>{destFolderName}</strong> folder.
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (singlePathMatch) {
    const targetPath = singlePathMatch[1]
    const destParts = targetPath.split(/[\\/]/)
    const destFolderName = destParts[destParts.length - 1]

    return (
      <div className="flex flex-col gap-2 mt-1">
        <span>{friendlyMessage}</span>
        <div className="bg-red-50/50 p-2.5 rounded border border-red-100/50 mt-1 space-y-1.5 text-left text-[11px] text-red-700/80">
          <div className="flex items-start gap-1">
            <span className="shrink-0 leading-tight">↳</span>
            <div>
              Failed while accessing the <strong>{destFolderName}</strong> folder.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <span>{friendlyMessage}</span>
}
