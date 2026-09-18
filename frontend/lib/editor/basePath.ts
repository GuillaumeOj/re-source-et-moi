import "server-only";

import { notFound } from "next/navigation";
import { connection } from "next/server";
import { editorPath } from "./path";

/**
 * The editor's public base path ("/admin-3f2c…"), for its pages' links. Every link points
 * at the secret URL, never at the internal `/espace-edition`, which the proxy blocks.
 *
 * Read at request time, not build time, so the secret is never baked into a prerendered
 * file and the links always match what the proxy is currently serving. A disabled editor
 * (see editorPath) is a 404.
 */
export async function editorBasePath(): Promise<string> {
  await connection();
  const secret = editorPath();
  if (secret === null) {
    notFound();
  }
  return `/${secret}`;
}
