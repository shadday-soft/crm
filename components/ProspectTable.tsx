"use client";

import type { Prospect } from "@/lib/types";
import {
  CONTACT_STATUS,
  PROPOSAL_STATUS,
  CONTACT_CHANNEL,
  findOption,
  prettifyType,
} from "@/lib/constants";
import StatusBadge from "./StatusBadge";
import StarRating from "./StarRating";
import { formatDate } from "@/lib/format";

type Props = {
  prospects: Prospect[];
  onSelect: (p: Prospect) => void;
  selectedId?: string | null;
};

export default function ProspectTable({ prospects, onSelect, selectedId }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-body-sm">
        <thead>
          <tr className="border-b border-line bg-surface-subtle text-left text-label-md uppercase text-on-surface-variant">
            <th className="px-4 py-3 font-medium">Negocio</th>
            <th className="px-4 py-3 font-medium">Teléfono</th>
            <th className="px-4 py-3 font-medium">Calificación</th>
            <th className="px-4 py-3 font-medium">Categoría</th>
            <th className="px-4 py-3 font-medium">Zona</th>
            <th className="px-4 py-3 font-medium">Contacto</th>
            <th className="px-4 py-3 font-medium">Propuesta</th>
            <th className="px-4 py-3 font-medium">Últ. contacto</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {prospects.map((p) => {
            const contact = findOption(CONTACT_STATUS, p.contactStatus);
            const proposal = findOption(PROPOSAL_STATUS, p.proposalStatus);
            const channel = findOption(CONTACT_CHANNEL, p.contactChannel);
            const selected = p.id === selectedId;
            return (
              <tr
                key={p.id}
                onClick={() => onSelect(p)}
                className={`cursor-pointer transition-colors ${
                  selected ? "bg-primary/10" : "hover:bg-surface-subtle"
                }`}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-on-surface">{p.name}</div>
                  {p.address && (
                    <div className="mt-0.5 max-w-[260px] truncate text-label-md text-on-surface-variant">
                      {p.address}
                    </div>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {p.phone || <span className="text-on-surface-variant/50">—</span>}
                </td>
                <td className="px-4 py-3">
                  <StarRating rating={p.rating} count={p.userRatingCount} size={13} />
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-surface-container px-2 py-0.5 text-label-md text-on-surface-variant">
                    {prettifyType(p.category)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {p.zone || <span className="text-on-surface-variant/50">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col items-start gap-1">
                    <StatusBadge option={contact} />
                    {channel && <span className="text-label-md text-on-surface-variant/70">{channel.label}</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge option={proposal} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-on-surface-variant">
                  {formatDate(p.lastContactDate)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
