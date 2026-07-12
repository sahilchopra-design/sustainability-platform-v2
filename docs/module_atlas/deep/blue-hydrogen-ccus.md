## 7 · Methodology Deep Dive

> ⚠️ **Unimplemented placeholder.** This module id resolves to an **empty stub**. The
> feature directory `frontend/src/features/blue-hydrogen-ccus/` contains only an empty
> `pages/` folder — there is **no page component, no route registration, no MODULE_GUIDES
> entry, no backend engine and no seed data**. Nothing is rendered or computed. It
> appears to be a naming duplicate of the fully-implemented `blue-hydrogen-ccs`
> ("CCS" vs "CCUS") that was scaffolded but never built out.

### 7.1 What the module computes

Nothing. There is no source file to ground formulas in. A search of the frontend for
`blue-hydrogen-ccus` / `BlueHydrogenCcus` returns no imports, no `React.lazy` entry,
and no `App.js` route. The assignment record carries empty `source_files`, `engines`,
`route_files`, `computed`, `seed_schemas` and a null `guide`.

### 7.2 Relationship to the real module

The intended functionality — blue-hydrogen production with carbon capture,
**utilisation** and storage economics — is delivered by the sibling module
**`blue-hydrogen-ccs`** (route `/blue-hydrogen-ccs`, EP-DS6). That page implements a
real annuitised LCOH model (`calcBlueH2Lcoh`), six production routes (SMR/ATR/POX/
pyrolysis), six geological storage sites, a methane-slip GWP100 lifecycle overlay and
a carbon-tax cost. See `blue-hydrogen-ccs.md` for the full methodology deep dive and
model specification.

The only conceptual delta a genuine "CCU**S**" variant would add over "CCS" is the
**utilisation** pathway: instead of (or alongside) geological storage, captured CO₂ is
sold as feedstock (urea, methanol, synthetic fuels, EOR, food-grade CO₂). Under US
§45Q this is the **$60/tCO₂ utilisation** rate (vs $85/t geological storage), and the
lifecycle credit must net any CO₂ subsequently re-released from the utilised product.
None of this is implemented in code.

### 7.3 Data provenance & limitations

- **No data, no model, no output.** The directory is an empty scaffold.
- Recommended remediation: either delete the stub, or redirect the route to
  `blue-hydrogen-ccs`, or build the utilisation-pathway extension described above and
  register the route. Until then this atlas entry documents the *absence* honestly
  rather than describing behaviour that does not exist.

**Framework alignment:** N/A — nothing is implemented. For the standards that a built
version should follow (IEA CCUS, Global CCS Institute, US §45Q utilisation $60/tCO₂,
IPCC GWP), refer to `blue-hydrogen-ccs.md`, whose §8 model specification applies
directly, extended with a CO₂-utilisation carbon-balance term.
