"use client";

import { FolderGit, ExternalLink } from "lucide-react";
import { PROJECTS } from "@/data/projects";
import { withBasePath } from "@/lib/asset-path";
import { useT } from "@/lib/i18n";

export function ProjectsContent() {
  const t = useT();

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {t({ ru: "Мои проекты", en: "My Projects" })}
        </h1>
        <p className="mt-3 text-muted">
          {t({
            ru: "Пара вещей, которые я написал и поддерживаю.",
            en: "A couple of things I've built and maintain.",
          })}
        </p>
      </div>

      <div className="grid w-full gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map((project) => (
          <div
            key={project.slug}
            className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- animated GIF, must stay unoptimized to keep frames */}
            <img
              src={withBasePath(project.gif)}
              alt={t({ ru: "Демонстрация: ", en: "Demo: " }) + project.title}
              loading="lazy"
              decoding="async"
              className="aspect-video w-full object-cover"
            />
            <div className="flex flex-1 flex-col p-6 text-left">
              <h2 className="text-lg font-semibold text-foreground">
                {project.title}
              </h2>
              <p className="mt-2 flex-1 text-sm text-muted">
                {t(project.description)}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {project.stack.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent"
                >
                  <FolderGit className="size-4" />
                  GitHub
                </a>
                {project.liveUrl && (
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105 active:scale-95"
                  >
                    <ExternalLink className="size-4" />
                    {t({ ru: "Открыть демо", en: "Open demo" })}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
