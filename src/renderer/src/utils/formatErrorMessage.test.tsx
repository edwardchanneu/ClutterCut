import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { formatErrorMessage } from './formatErrorMessage'

describe('formatErrorMessage', () => {
  it('returns a friendly message for permission denied errors', () => {
    const error = "EACCES: permission denied, rename '/src' -> '/dest'"
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(screen.getByText(/Permission denied/i)).toBeInTheDocument()
    expect(screen.getByText(/Could not move/i)).toBeInTheDocument()
  })

  it('returns a friendly message for missing file or directory errors', () => {
    const error = "ENOENT: no such file or directory, scandir '/path/to/missing'"
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(screen.getByText(/File or destination folder could not be found/i)).toBeInTheDocument()
    expect(screen.getByText(/Failed while accessing the/i)).toBeInTheDocument()
    expect(screen.getByText(/missing/i)).toBeInTheDocument()
  })

  it('returns a friendly message for no space left on device errors', () => {
    const error = "ENOSPC: no space left on device, mkdir '/path/to/dest'"
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(screen.getByText(/Not enough disk space to move this file/i)).toBeInTheDocument()
  })

  it('returns a friendly message for resource busy errors', () => {
    const error = 'EBUSY: resource busy or locked'
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(
      screen.getByText(/The file is currently being used by another program/i)
    ).toBeInTheDocument()
  })

  it('returns a friendly message for not a directory errors', () => {
    const error = "ENOTDIR: not a directory, open '/path/is/file/not/dir'"
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(
      screen.getByText(/The destination you selected is currently an existing file/i)
    ).toBeInTheDocument()
  })

  it('returns a friendly message for existing file errors', () => {
    const error = "EEXIST: file already exists, mkdir '/path/to/exist'"
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(
      screen.getByText(/A file or folder with this name already exists at the destination/i)
    ).toBeInTheDocument()
  })

  it('correctly parses rename error details', () => {
    // Choose names that won't overlap with path components like "Users" or "user"
    const error = "rename '/path/to/my-file.txt' -> '/path/to/my-folder/subdir'"
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(screen.getByText('my-file.txt')).toBeInTheDocument()
    expect(screen.getByText('my-folder')).toBeInTheDocument()
    expect(screen.getByText(/into the/)).toBeInTheDocument()
  })

  it('correctly parses single path error details', () => {
    const error = "mkdir '/path/to/target-folder'"
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(screen.getByText(/Failed while accessing the/)).toBeInTheDocument()
    expect(screen.getByText('target-folder')).toBeInTheDocument()
  })

  it('returns the raw error if no matches are found', () => {
    const error = 'Some unknown error occurred'
    const result = formatErrorMessage(error)
    render(<div>{result}</div>)

    expect(screen.getByText('Some unknown error occurred')).toBeInTheDocument()
  })
})
