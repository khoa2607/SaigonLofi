# Báo cáo tích hợp Bàn Tơ Động + Hỏa Vân Động

Ngày kiểm tra: **2026-11-21**

Branch review: **`integration/tayduky-codex-biomes`**

Nền Claude: **`3429cd4`**

Nguồn Codex: **`0ea38ce`** (`e1231d4` Bàn Tơ Động, `fd13434` Hỏa Vân Động, `0ea38ce` sửa lỗi parse/runtime HVD)

Branch này chỉ dành cho review. Chưa merge vào `feature/tayduky-redesign-v2` hoặc `main`, chưa push.

## Kết quả tích hợp

- Dùng runtime Claude làm nền; chỉ thêm hook BTD/HVD vào loader, map, art/fx, renderer, simulation, camera và Story Director.
- Giữ đầy đủ sân khấu Bàn Tơ Động: động lớn, ngai nhện, đài giam tơ, sân chiến đấu, ba thác, bảy chị em, nhện con và chuỗi bắt giữ → giao chiến → khỉ phân thân cứu Đường Tăng → hậu quả → phục hồi.
- Giữ đầy đủ Hỏa Vân Động: thành động, làng, sân nghi lễ, thác, trại lính, Hồng Hài Nhi, Quan Âm, lính/công nhân/học đồ và chuỗi Tam Muội Chân Hỏa.
- Registry được hợp nhất từ `pl_cast.json`, `sprite_picks.json` và `pack_pl_chars.py`, sau đó tạo lại `chars.js`, `sprites.js`, catalog và contact sheet. Kết quả: **60 nhân vật**, **215 object sprites**.
- Không gọi PixelLab và không tiêu credit mới trong lượt tích hợp. Nguồn, state ID và số generation lịch sử nằm trong `PIXELLAB.md`.

## Material IDs

Thông Thiên Hà giữ nguyên **120–126**. Hỏa Vân Động chuyển sang dải chưa dùng **156–161** và được đăng ký tập trung trong `tw-map.js`:

| ID | Tên | Mục đích |
|---:|---|---|
| 156 | `HCRIM` | mép/vách đỏ |
| 157 | `HCOPPER` | sân đá đồng |
| 158 | `HPINE` | nền rừng thông |
| 159 | `HPATH` | đường HVD |
| 160 | `HASH` | tro/nền cháy |
| 161 | `HBRIDGE` | cầu và lối nối |

`tw-hvd.js` chỉ xác nhận dải đã đăng ký, không tự gán lại. Test map và HVD kiểm tra cả dải TTH lẫn HVD để tránh tái phát collision.

## Footprint và kết nối

| Phiên bản | Diện tích | Bounds |
|---|---:|---|
| Codex cũ | 1.120 tiles | `[1,1]–[36,90]` |
| Claude hiện tại / kết quả cuối | **991 tiles** | **`[1,7]–[35,90]`** |

- Giao nhau: **982 tiles**.
- Phần chỉ có ở Codex: **138 tiles**; 137 tile nay thuộc Bạch Cốt Lĩnh, 1 tile thuộc placeholder Cổ Lãng Tự.
- Phần chỉ có ở layout Claude: **9 tiles**.
- Không scale tọa độ. Thành động, sân nghi lễ, court, prison, waterfall và toàn bộ **25 POI có thể đi tới** được giữ.
- Thêm một lối ngắn từ sân nghi lễ tới seam Thiên Cung tại `(26,33)` để khôi phục liên thông toàn bản đồ mà không lấn Bạch Cốt Lĩnh.
- Adjacency HVD cuối: `bcl`, `tc`, `clt`, `btd`, `hds`. Bản đồ hiện có **12/15 biome hoàn chỉnh**; `lat`, `clt`, `lhd` vẫn là placeholder theo branch nền.

## Xác minh

### Node / mô phỏng

- `tayduky-v2-map15.mjs`: 15 vùng liên thông; Director tối đa 5, không signature kề nhau; HVD 991 tiles.
- `tayduky-v2-sim.mjs 1800 7` và `1800 21`: cả 12 biome đã xây đi qua `peace/fore/sig/after`; `maxActive=4`; 0 adjacency violation, 0 bad tile, 0 teleport.
- `tayduky-v2-banto.mjs`: đủ bảy chị em, ba thác, năm phân thân, Tang bị trói và phục hồi hoàn chỉnh.
- `tayduky-v2-hvd.mjs`: 991 tiles, 25 POI, 17 cư dân, 7 mini-events, hai vòng signature và phục hồi.
- `tayduky-v2-hqs-sim.mjs`, `tayduky-v2-btp-sim.mjs`, `tayduky-v2-bcl-sim.mjs`, `tayduky-v2-ntq-sim.mjs`: PASS.
- Parse/load checks cho toàn bộ module BTD/HVD/shared: PASS; không còn `SyntaxError` từ lỗi literal `\n`.

### Chrome thật

- BTD: capture, battle, rescue, aftermath, recovery, day/night và normal/wide zoom: PASS, 0 exception.
- HVD: capture, True Fire, Quan Âm, aftermath, recovery, day/night, normal/wide, fortress, waterfall, south rim và seam lân cận: PASS, 0 exception.
- Regression: Hoa Quả Sơn, Lòng Bàn Tay Phật Tổ, Bạch Cốt Lĩnh, Hắc Phong Sơn, Ngũ Hành Sơn, Ngũ Trang Quán, Thông Thiên Hà, Sư Đà Lĩnh, Hỏa Diệm Sơn và cả hai signature Thiên Cung: PASS.
- `tayduky-v2-world.mjs 30`: 12 biome built, 0 exception; draw median **1,6 ms**, p90 **2,5 ms** trong lượt đo.
- Server tương tác của worktree review đang ở `http://127.0.0.1:8767/tayduky/`. Cổng 8766 đã có một server bên ngoài worktree này nên không bị dừng hay thay đổi.
- URL HVD đã xác minh: `http://127.0.0.1:8767/tayduky/?at=hvd&tod=day&zoom=1&seed=7&runtime=fixed`. Kết quả runtime: `built=true`, material tâm `156` (placeholder là `44`), **173 props**, camera đúng bookmark.

Ảnh review nằm trong `screenshots/banto-redesign/` và `screenshots/hvd-redesign/`.

## Giới hạn đã biết

- Seam góc rộng giữa HVD, Bạch Cốt Lĩnh và Thiên Cung vẫn đổi palette khá gắt; chức năng, occlusion và walkability đúng nhưng có thể cần một pass trang trí chuyển tiếp sau review.
- Một số cụm lều và lò lửa HVD lặp hình khi xem ở zoom rộng.
- Các thác mảnh ở Bàn Tơ Động đọc tốt ở normal zoom nhưng yếu hơn ở widest view.
- Ba biome chưa xây vẫn dùng placeholder của branch Claude; lượt tích hợp này không mở rộng phạm vi sang chúng.
