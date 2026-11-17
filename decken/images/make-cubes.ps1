param([string]$OutDir)
# Genera cubos isométricos animados (SVG): base NxN con 4 niveles (z = 0..3).
# Cada línea de servicio es un nivel (LVL1 arriba ... LVL4 en la base).
# Proyección: X = OX + (x - y)*C ; Y = OY + (x + y)*H - z*S
# Uso: powershell -File make-cubes.ps1 -OutDir <carpeta images>
$ci = [Globalization.CultureInfo]::InvariantCulture
function F([double]$v) { $v.ToString('0.##', $ci) }

$N = 4                      # cubos por lado de la base (4x4)
$LV = 4                     # niveles de altura
$S = 40.0; $C = $S * 0.8660254; $H = $S * 0.5
$OX = 222.0; $OY = 182.0
$VBW = 380; $VBH = 360      # viewBox
$G = 0.075; $L = 1 - 2 * $G

function P([double]$x, [double]$y, [double]$z) { @(($OX + ($x - $y) * $C), ($OY + ($x + $y) * $H - $z * $S)) }
function Poly($pts, $fill) {
  $d = ($pts | ForEach-Object { "$(F $_[0]),$(F $_[1])" }) -join ' '
  "<polygon points=""$d"" fill=""$fill""/>"
}

# Tonos por nivel (z): [superior, izquierda, derecha] — de navy (arriba) a azul claro (base)
$tones = @{
  3 = @('#2F5AAE', '#1B4189', '#123373');
  2 = @('#3E7FCC', '#2667B3', '#1E58A0');
  1 = @('#5FA6E2', '#4590D3', '#3A80C4');
  0 = @('#B6D5F4', '#98C1EA', '#84B0E0')
}
$glyph = 'M.16 .3H.46V.56H.84M.3 .82V.66H.62'

function Cube([int]$x, [int]$y, [int]$z) {
  $t = $tones[$z]
  # (ojo: PowerShell no distingue mayúsculas; no reutilizar $C, $H, $S, $L, $G)
  $x0 = $x + $G; $x1 = $x + 1 - $G; $y0 = $y + $G; $y1 = $y + 1 - $G; $z0 = $z + $G; $z1 = $z + 1 - $G
  $top   = Poly @((P $x0 $y0 $z1), (P $x1 $y0 $z1), (P $x1 $y1 $z1), (P $x0 $y1 $z1)) $t[0]
  $left  = Poly @((P $x0 $y1 $z1), (P $x1 $y1 $z1), (P $x1 $y1 $z0), (P $x0 $y1 $z0)) $t[1]
  $right = Poly @((P $x1 $y0 $z1), (P $x1 $y1 $z1), (P $x1 $y1 $z0), (P $x1 $y0 $z0)) $t[2]
  # circuitos sobre las caras laterales (matriz que lleva el cuadrado unitario a la cara)
  $p0 = P $x0 $y1 $z1
  $ml = "matrix($(F ($L*$C)),$(F ($L*$H)),0,$(F ($L*$S)),$(F $p0[0]),$(F $p0[1]))"
  $p1 = P $x1 $y1 $z1
  $mr = "matrix($(F ($L*$C)),$(F (-$L*$H)),0,$(F ($L*$S)),$(F $p1[0]),$(F $p1[1]))"
  $g1 = "<path transform=""$ml"" d=""$glyph""/>"
  $g2 = "<path transform=""$mr"" d=""$glyph""/>"
  "<g>$top$left$right<g class=""c"">$g1$g2</g></g>"
}

function Build([string]$name, [int[]]$slot, [string]$title) {
  $cubes = @()
  foreach ($z in 0..($LV - 1)) { foreach ($x in 0..($N - 1)) { foreach ($y in 0..($N - 1)) { $cubes += ,@($x, $y, $z) } } }
  # orden del pintor: de atrás hacia adelante
  $cubes = $cubes | Sort-Object { $_[0] + $_[1] + $_[2] }, { $_[2] }, { $_[0] }

  # pieza: sale hacia la izquierda (dirección +y) y un poco hacia arriba
  $pieceX = -2.1 * $C; $pieceY = 2.1 * $H - 0.9 * $S
  $body = New-Object Text.StringBuilder
  foreach ($k in $cubes) {
    if ($k[0] -eq $slot[0] -and $k[1] -eq $slot[1] -and $k[2] -eq $slot[2]) {
      $piece = Cube $slot[0] $slot[1] $slot[2]
      $x0 = $slot[0] + $G; $x1 = $slot[0] + 1 - $G; $y0 = $slot[1] + $G; $y1 = $slot[1] + 1 - $G; $z1 = $slot[2] + 1 - $G; $z0 = $slot[2] + $G
      $glow = Poly @((P $x0 $y1 $z1), (P $x1 $y1 $z1), (P $x1 $y1 $z0), (P $x0 $y1 $z0)) '#FFFFFF'
      $glowTop = Poly @((P $x0 $y0 $z1), (P $x1 $y0 $z1), (P $x1 $y1 $z1), (P $x0 $y1 $z1)) '#FFFFFF'
      [void]$body.Append("<g class=""piece"">$piece<g class=""glow"">$glow$glowTop</g></g>")
    } else {
      [void]$body.Append((Cube $k[0] $k[1] $k[2]))
    }
  }

  $tx = F $pieceX; $ty = F $pieceY; $tyUp = F ($pieceY - 10)
  $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 $VBW $VBH" role="img" aria-labelledby="t">
<title id="t">$title</title>
<style>
polygon{stroke:#fff;stroke-width:1.6;stroke-linejoin:round}
.c path{fill:none;stroke:#fff;stroke-width:1.2;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:.5}
.cube{animation:float 6s ease-in-out infinite}
.piece{transform:translate(${tx}px,${ty}px);animation:snap 8s cubic-bezier(.55,0,.25,1) infinite}
.glow{opacity:0;animation:flash 8s ease-out infinite}
.glow polygon{stroke:none}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes snap{
0%{transform:translate(${tx}px,${ty}px)}
12%{transform:translate(${tx}px,${tyUp}px)}
24%{transform:translate(${tx}px,${ty}px)}
42%{transform:translate(0,0)}
74%{transform:translate(0,0)}
90%,100%{transform:translate(${tx}px,${ty}px)}}
@keyframes flash{0%,41%{opacity:0}46%{opacity:.6}60%,100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.cube,.piece,.glow{animation:none}}
</style>
<g class="cube">$($body.ToString())</g>
</svg>
"@
  $path = Join-Path $OutDir $name
  [IO.File]::WriteAllText($path, $svg, (New-Object Text.UTF8Encoding($false)))
  "{0}: {1:N1} KB" -f $name, ((Get-Item $path).Length / 1KB)
}

# La pieza va en la columna frontal izquierda (x = 0, y = N-1), en el nivel de cada línea
$fy = $N - 1
Build 'cubo-1.svg' @(0, $fy, 3) 'Cubo de soluciones: la pieza de Solutions Development encaja en el nivel 1'
Build 'cubo-2.svg' @(0, $fy, 2) 'Cubo de soluciones: la pieza de Automation encaja en el nivel 2'
Build 'cubo-3.svg' @(0, $fy, 1) 'Cubo de soluciones: la pieza de Data Management encaja en el nivel 3'
Build 'cubo-4.svg' @(0, $fy, 0) 'Cubo de soluciones: la pieza de Modelos de Entrega encaja en el nivel 4'
