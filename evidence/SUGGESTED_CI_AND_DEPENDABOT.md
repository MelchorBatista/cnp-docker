# Recomendación: Dependabot y flujo CI (nota para evidencia de "Actualización")

## Hallazgo

No se detectó una configuración de Dependabot ni workflows en `.github/workflows` que ejecuten pruebas y auditorías de seguridad automáticamente. Añadir estas piezas mejora la trazabilidad de actualizaciones y responde al requisito de "Actualización" para NORTIC A6.

## Plantilla sugerida: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    ignore: []
```

## Plantilla sugerida: `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: "18"
      - name: Install
        run: |
          cd backend
          npm ci
      - name: Typecheck
        run: |
          cd backend
          npm run typecheck
      - name: Run tests
        run: |
          cd backend
          npm test --silent
      - name: Audit dependencies
        run: |
          cd backend
          npm audit --audit-level=moderate || true
```

## Siguiente paso sugerido

Puedo crear un PR que agregue `dependabot.yml` y el `ci.yml` de ejemplo si deseas automatizar las actualizaciones y pruebas. Esto cerraría la brecha detectada en el criterio de Actualización.
