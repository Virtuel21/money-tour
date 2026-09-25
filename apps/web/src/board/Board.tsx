import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { type GameState, type Tile } from '@money-tour/engine';
import { colors, money } from '../game/local';

const SIZE = 810,
  CELL = 86,
  GAP = 4,
  PAD = 2;
const ink = 0x142d3d,
  cream = 0xfff6df;
export function tilePoint(id: number): { x: number; y: number } {
  if (id <= 8) return { x: 8 - id, y: 8 };
  if (id <= 16) return { x: 0, y: 16 - id };
  if (id <= 24) return { x: id - 16, y: 0 };
  return { x: 8, y: id - 24 };
}
function label(
  parent: Container,
  text: string,
  x: number,
  y: number,
  size = 11,
  fill = ink,
  bold = false,
  wrap = 80,
): Text {
  const node = new Text({
    text,
    style: {
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: size,
      fontWeight: bold ? 'bold' : 'normal',
      fill,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: wrap,
    },
  });
  node.anchor.set(0.5);
  node.position.set(x, y);
  parent.addChild(node);
  return node;
}
function house(g: Graphics, x: number, y: number, color: number, height = 19): void {
  g.roundRect(x, y, 16, height, 2).fill(color);
  g.poly([x - 2, y, x + 8, y - 9, x + 18, y]).fill(ink);
  g.rect(x + 4, y + 5, 3, 4).fill(cream);
  g.rect(x + 10, y + 5, 3, 4).fill(cream);
  g.rect(x + 7, y + height - 6, 4, 6).fill(ink);
}
export function drawPawn(index: number, color: number): Container {
  const node = new Container();
  const g = new Graphics();
  node.addChild(g);
  g.ellipse(0, 12, 13, 5).fill({ color: ink, alpha: 0.2 });
  if (index === 0) {
    g.poly([-14, 5, 14, 5, 7, 13, -8, 13]).fill(color).stroke({ color: ink, width: 2 });
    g.moveTo(0, 5).lineTo(0, -19).stroke({ color: ink, width: 2 });
    g.poly([-2, -18, -2, 2, -15, 2]).fill(cream).stroke({ color: ink, width: 1.5 });
    g.poly([2, -13, 2, 2, 13, 2]).fill(color);
  }
  if (index === 1) {
    g.ellipse(0, -8, 13, 17).fill(color).stroke({ color: ink, width: 2 });
    g.ellipse(0, -8, 5, 16).fill(cream);
    g.moveTo(-7, 5).lineTo(-5, 12).moveTo(7, 5).lineTo(5, 12).stroke({ color: ink, width: 1.5 });
    g.roundRect(-6, 11, 12, 7, 2).fill(ink);
  }
  if (index === 2) {
    g.poly([-9, 13, -6, -14, 6, -14, 9, 13]).fill(cream).stroke({ color: ink, width: 2 });
    g.rect(-7, 0, 14, 6).fill(color);
    g.rect(-6, -16, 12, 7).fill(color);
    g.poly([-9, -16, 0, -24, 9, -16]).fill(ink);
    g.circle(0, -12, 2).fill(cream);
  }
  if (index === 3) {
    g.poly([0, -22, 14, -7, 0, 10, -14, -7]).fill(color).stroke({ color: ink, width: 2 });
    g.poly([0, -22, 0, 10, -14, -7]).fill(cream);
    g.moveTo(0, 10).bezierCurveTo(-12, 15, 14, 18, 0, 24).stroke({ color: ink, width: 2 });
  }
  return node;
}
function pictogram(g: Graphics, tile: Tile, x: number, y: number): void {
  const color = Number.parseInt((tile.color ?? '#2ba8bc').slice(1), 16);
  if (tile.type === 'city') {
    const variety = tile.id % 4;
    g.ellipse(x, y + 14, 28, 6).fill({ color: ink, alpha: 0.09 });
    house(g, x - 24, y - 3, color, 17 + variety * 2);
    house(g, x - 3, y - 10, color, 27);
    house(g, x + 17, y, color, 16);
    if (variety === 0) g.circle(x + 24, y - 7, 8).fill(0x70a88b);
    if (variety === 1) g.rect(x + 3, y - 28, 5, 10).fill(ink);
    if (variety === 2) g.roundRect(x - 21, y - 2, 10, 4, 1).fill(cream);
  } else if (tile.type === 'resort' || tile.type === 'island') {
    g.ellipse(x, y + 13, 28, 8).fill(0xe6b94a);
    g.moveTo(x, y + 11)
      .quadraticCurveTo(x + 2, y - 3, x - 4, y - 11)
      .stroke({ color: 0x8a6850, width: 5 });
    for (const dx of [-22, -10, 12, 23])
      g.moveTo(x - 4, y - 11)
        .quadraticCurveTo(x + dx, y - 24, x + dx, y - 4)
        .stroke({ color: 0x70a88b, width: 5 });
    g.moveTo(x - 28, y + 22)
      .quadraticCurveTo(x - 18, y + 16, x - 7, y + 22)
      .quadraticCurveTo(x + 8, y + 28, x + 24, y + 22)
      .stroke({ color: 0x2ba8bc, width: 2 });
  } else if (tile.type === 'chance') {
    g.roundRect(x - 23, y - 13, 46, 31, 5).fill(0x9683c5);
    g.poly([x - 23, y - 13, x, y + 3, x + 23, y - 13]).fill(0xc5b7e3);
    g.star(x + 19, y - 12, 4, 11, 4).fill(0xe6b94a);
  } else if (tile.type === 'tax') {
    g.poly([x - 25, y - 9, x, y - 23, x + 25, y - 9]).fill(ink);
    for (const dx of [-18, -3, 12]) g.rect(x + dx, y - 5, 6, 25).fill(0x637e94);
    g.roundRect(x - 26, y + 21, 52, 5, 2).fill(ink);
  } else if (tile.type === 'championship') {
    g.poly([x - 16, y - 20, x + 16, y - 20, x + 11, y + 2, x, y + 9, x - 11, y + 2]).fill(0xe6b94a);
    g.circle(x - 18, y - 11, 9).stroke({ color: 0xe6b94a, width: 4 });
    g.circle(x + 18, y - 11, 9).stroke({ color: 0xe6b94a, width: 4 });
    g.rect(x - 3, y + 8, 6, 10).fill(ink);
    g.roundRect(x - 13, y + 18, 26, 5, 2).fill(ink);
  } else if (tile.type === 'travel') {
    g.poly([x - 29, y - 13, x + 29, y - 22, x + 5, y + 21, x - 2, y + 2])
      .fill(0x2ba8bc)
      .stroke({ color: ink, width: 1.5 });
    g.poly([x - 2, y + 2, x + 29, y - 22, x - 10, y - 3]).fill(cream);
  } else {
    g.circle(x, y, 23).fill(0xe6b94a);
    g.star(x, y, 4, 21, 6, -Math.PI / 4).fill(ink);
    g.circle(x, y, 5).fill(cream);
  }
}

export default function Board({
  state,
  onTile,
  reducedMotion = false,
  demo = false,
}: {
  state: GameState;
  onTile: (id: number) => void;
  reducedMotion?: boolean;
  demo?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    appRef = useRef<Application | null>(null);
  const stateRef = useRef(state),
    tileCallback = useRef(onTile),
    motion = useRef(reducedMotion);
  stateRef.current = state;
  tileCallback.current = onTile;
  motion.current = reducedMotion;
  const [error, setError] = useState('');
  const renderRef = useRef<() => void>(() => {});
  const visualKey = JSON.stringify([
    state.properties,
    state.players.map((p) => [p.position, p.eliminated]),
    state.festivals,
    state.currentPlayer,
  ]);
  useEffect(() => {
    let disposed = false;
    const app = new Application();
    appRef.current = app;
    let layer: Container;
    const pawns: Container[] = [];
    const positions: number[] = [];
    const targets: number[] = [];
    const init = async () => {
      try {
        await app.init({
          width: SIZE,
          height: SIZE,
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          autoDensity: true,
          preference: 'webgl',
        });
        if (disposed) {
          app.destroy(true, { children: true });
          return;
        }
        host.current?.appendChild(app.canvas);
        app.canvas.setAttribute('aria-hidden', 'true');
        layer = new Container();
        app.stage.addChild(layer);
        const pawnLayer = new Container();
        app.stage.addChild(pawnLayer);
        const draw = () => {
          const game = stateRef.current;
          for (const old of layer.removeChildren()) old.destroy({ children: true });
          const sea = new Graphics();
          layer.addChild(sea);
          sea.roundRect(0, 0, SIZE, SIZE, 28).fill(0x142d3d);
          sea.roundRect(94, 94, 622, 622, 22).fill(0xc1e4db);
          for (let row = 0; row < 12; row++)
            for (let col = 0; col < 11; col++)
              sea
                .moveTo(113 + col * 54, 123 + row * 49)
                .quadraticCurveTo(124 + col * 54, 116 + row * 49, 136 + col * 54, 123 + row * 49)
                .stroke({ color: 0xffffff, alpha: 0.25, width: 2 });
          sea
            .poly([
              204, 378, 245, 339, 281, 357, 326, 332, 365, 348, 389, 399, 374, 435, 292, 458, 229,
              427,
            ])
            .fill(0x8ab798);
          sea
            .poly([492, 252, 527, 229, 576, 244, 608, 281, 586, 314, 541, 325, 500, 302])
            .fill(0xe6c97b);
          for (let i = 0; i < 5; i++)
            house(
              sea,
              247 + i * 20,
              386 - (i % 3) * 15,
              i % 2 ? 0xe8725b : 0xfff6df,
              20 + (i % 3) * 5,
            );
          for (let i = 0; i < 4; i++)
            sea.circle(522 + i * 16, 267 + (i % 2) * 13, 10).fill(0x70a88b);
          label(layer, 'L’ARCHIPEL DES POSSIBLES', 405, 163, 13, 0x416f67, true, 580);
          label(layer, 'MONEY', 405, 220, 64, ink, true);
          label(layer, 'TOUR', 405, 276, 64, ink, true);
          label(layer, 'Un archipel, mille fortunes.', 405, 313, 17, 0x416f67, false, 580);
          label(layer, 'ACHETEZ  ·  CONSTRUISEZ  ·  VOYAGEZ', 405, 642, 12, 0x416f67, true, 580);
          for (const tile of game.config.board) {
            const { x, y } = tilePoint(tile.id);
            const cell = new Container();
            cell.position.set(PAD + x * (CELL + GAP), PAD + y * (CELL + GAP));
            layer.addChild(cell);
            const g = new Graphics();
            cell.addChild(g);
            const corner = tile.id % 8 === 0;
            g.roundRect(0, 0, CELL, CELL, corner ? 12 : 8).fill(corner ? 0xf2db9b : cream);
            const property = game.properties[tile.id];
            if (tile.color)
              g.roundRect(5, 5, CELL - 10, 8, 3).fill(Number.parseInt(tile.color.slice(1), 16));
            pictogram(g, tile, 43, corner ? 34 : 37);
            const short =
              tile.type === 'championship'
                ? 'CHAMPIONNAT'
                : tile.type === 'travel'
                  ? 'TOUR DU MONDE'
                  : tile.type === 'chance'
                    ? 'CHANCE'
                    : tile.type === 'tax'
                      ? 'CONTRIBUTION'
                      : tile.name.toUpperCase();
            label(cell, short, 43, corner ? 67 : 66, corner ? 10 : 9, ink, true);
            if (tile.price) label(cell, money(tile.price, true), 43, 79, 9, 0x48606c);
            if (property?.ownerId) {
              const index = game.players.findIndex((p) => p.id === property.ownerId);
              const c = Number.parseInt(colors[index]!.slice(1), 16);
              g.roundRect(1, 1, CELL - 2, CELL - 2, 8).stroke({ color: c, width: 3 });
              g.circle(74, 21, 8).fill(c);
              label(cell, String(index + 1), 74, 21, 10, 0xffffff, true);
              if (property.level) {
                for (let level = 0; level < property.level; level++)
                  g.roundRect(6 + level * 11, 47, 8, 8, 1).fill(
                    property.level === 4 ? 0xe8725b : 0x70a88b,
                  );
                if (property.level === 4) label(cell, 'H', 22, 51, 10, ink, true);
              }
              if (property.championships)
                label(cell, `×${property.championships + 1}`, 70, 45, 12, ink, true);
            }
            if (game.festivals.includes(tile.id)) {
              g.moveTo(8, 18).lineTo(35, 18).stroke({ color: ink, width: 1 });
              for (let n = 0; n < 3; n++)
                g.poly([8 + n * 9, 18, 16 + n * 9, 18, 12 + n * 9, 25]).fill(
                  n % 2 ? 0xe8725b : 0xe6b94a,
                );
            }
            cell.eventMode = 'static';
            cell.cursor = 'pointer';
            cell.on('pointertap', () => tileCallback.current(tile.id));
          }
          game.players.forEach((player, index) => {
            if (!pawns[index]) {
              const pawn = drawPawn(index, Number.parseInt(colors[index]!.slice(1), 16));
              pawns[index] = pawn;
              pawnLayer.addChild(pawn);
              positions[index] = player.position;
            }
            targets[index] = player.position;
            pawns[index]!.visible = !player.eliminated;
          });
        };
        renderRef.current = draw;
        draw();
        app.ticker.add((ticker) => {
          pawns.forEach((pawn, index) => {
            const current = positions[index] ?? 0;
            const target = targets[index] ?? 0;
            let distance = (target - current + 32) % 32;
            if (distance > 28) distance -= 32;
            positions[index] = motion.current
              ? target
              : (current + distance * Math.min(1, ticker.deltaMS / 140) + 32) % 32;
            if (Math.abs(distance) < 0.02) positions[index] = target;
            const from = Math.floor(positions[index]!);
            const fraction = positions[index]! - from;
            const a = tilePoint(from),
              b = tilePoint((from + 1) % 32);
            const offsetX = (index % 2) * 22 - 11,
              offsetY = Math.floor(index / 2) * 16 - 8;
            pawn.position.set(
              PAD + (a.x + (b.x - a.x) * fraction) * (CELL + GAP) + 43 + offsetX,
              PAD + (a.y + (b.y - a.y) * fraction) * (CELL + GAP) + 40 + offsetY,
            );
          });
        });
      } catch (e) {
        if (!disposed) setError(e instanceof Error ? e.message : 'Rendu indisponible');
      }
    };
    void init();
    return () => {
      disposed = true;
      renderRef.current = () => {};
      if (app.renderer) app.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []);
  useEffect(() => {
    renderRef.current();
  }, [visualKey]);
  return (
    <div className={`board-shell ${demo ? 'board-demo' : ''}`}>
      <div ref={host} className="board-canvas" />
      {error && (
        <div className="board-fallback">
          <p>
            Le rendu graphique est indisponible. Le jeu reste accessible via les cases ci-dessous.
          </p>
          <div className="tile-list">
            {state.config.board.map((t) => (
              <button key={t.id} onClick={() => onTile(t.id)}>
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
