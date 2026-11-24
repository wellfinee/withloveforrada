# Реалистичный мишка

## Слои для анимации

Текущая версия: `teddy-bent-arm-smooth.png`, встроенный ImageGen. Запрос: сохранить квадратный холст, позу и точки плеча (.385,.575), локтя (.265,.735), запястья (.18,.625); увеличить толщину сегментов, не меняя их длину; сохранить медовый мохер, свет и прозрачность; сделать внутренний сгиб гладким, без полос, жёстких складок и швов. В анимации резкое переключение между костями заменено плавным смешиванием, проверенным на отсутствие перевёрнутых участков сетки во всём диапазоне поворота локтя.

Текущая рука: `teddy-bent-arm.png`, создана встроенным ImageGen по исходному мишке и предыдущему слою руки. Запрос: отдельная цельная согнутая рука без ладони; плечо сверху справа около (.40,.57), локоть ниже около (.27,.73), запястье сверху слева около (.19,.62); два сегмента с плавным изгибом, медовый мохер, совпадающее освещение, исходные квадратный холст и координаты, прозрачный фон, без головы, тела, пальцев и подушечек. Старый овальный обрубок заменить, не сохранять его форму.

Дополнительно встроенным ImageGen из `teddy-paw.png` созданы два независимых спрайта:

- `teddy-palm.png`: оставить только ладонь, пальцы, коричневые подушечки и вышитое сердечко; удалить длинное предплечье; закончить ладонь округлым меховым краем запястья около x .20 y .64; сохранить исходные квадратный холст, положение, размер, освещение и прозрачность.
- `teddy-forearm.png`: оставить только короткое меховое предплечье от запястья около x .22 y .63 до плеча около x .34 y .73; удалить ладонь, пальцы, подушечки и сердце; восстановить округлый конец запястья; сохранить исходные холст, положение, размер, фактуру, освещение и прозрачность.

Эти детали анимируются отдельными преобразованиями относительно плеча и запястья, без деформации общей текстуры мишки.

Встроенным ImageGen из исходного образа созданы `teddy-body.png` и `teddy-paw.png`, оба с прозрачностью. Они отрисовываются независимо: движение руки не применяется к текстуре головы, бантика и тела.

Запрос для тела: удалить всю поднятую руку слева, восстановить скрытые ею щёку и туловище, сохранить исходные координаты, размеры холста, лицо, бант, освещение и правую руку; не добавлять новую руку на её место.

Запрос для лапы: оставить только поднятую руку с сердечком в исходном положении и масштабе, удалить голову, щёку, бант, тело и вторую руку, сохранив прозрачность; не центрировать и не обрезать холст; закончить руку мягким меховым плечом без фрагментов тела.

## Исходный образ

Файл: `teddy-realistic.png`. Создан встроенным ImageGen, с прозрачным фоном.

Финальный запрос:

Use case: product-mockup. Asset type: transparent character asset for an interactive romantic anniversary webpage. Create a photorealistic premium handmade honey beige plush teddy bear, photographed in a studio, adorable and emotionally warm, waist-up portrait facing directly toward camera. True fluffy mohair fibers, individual soft hairs catching warm rim light, subtle sewn seams, stuffed rounded body with ivory plush belly, shiny small dark brown glass eyes with realistic catchlights, rounded ears, cream muzzle, embroidered dark brown nose and gentle stitched smile. Beautiful small deep forest green satin bow at base of neck with folded fabric and short ribbon tails. Pose: on the LEFT SIDE OF THE IMAGE the bear raises and reaches one arm towards camera, palm clearly visible and large in the foreground, realistic five soft rounded plush toe pads, a small subtle cream heart sewn on its central brown paw pad. The raised arm anatomically emerges from the bear's left image-side shoulder and naturally bends upward, NO long hanging oval stump below the palm. Other arm rests naturally at right side of torso. Front view with both eyes visible unobstructed; no exaggerated cartoon head. Composition square, full cutout including head, ears, raised paw and upper torso. Bear centered around x 55%, top of ears at y 7%, eyes near y 32%, nose near y 42%, raised palm center near x 22% y 53%, bottom of torso at y 95%. Paw should be clearly separated from muzzle by a small transparent gap. Soft warm key light from upper left, subtle green reflected fill light, lifelike three dimensional photographic materials. Transparent background with clean alpha around individual fur strands. NO scenery, no floor, no text, no letters, no watermark, no vector look, no illustration, no plastic 3D cartoon.

## Мишка на крыше

`city/rooftop-teddy.png` создан встроенным ImageGen из `teddy-realistic.png` с прозрачным фоном.

> Use case: precise-object-edit, identity-preserve. Make a full-body transparent cutout sprite of the SAME golden teddy bear for the rooftop scene of an existing website. Image 1 is the sole edit target and character reference. Outpaint below the abrupt crop to create a natural seated plush body, two rounded little hind paws resting forward on the same level, with subtle brown stitched foot pads. Keep the face, curliness and hue of the fur, cream muzzle with small brown embroidered nose, black glossy eyes, forest green satin bow, and especially the raised paw with its sewn cream heart in nearly the same pose and proportions as the reference. Right forepaw rests comfortably beside belly, friendly small smile. Extra clear margin around the entire silhouette, including left waving paw, ears and both feet; no edge may touch image boundary. Front facing at a subtle 10 degree elevated view, same plush realism and fine fur. Soft neutral ambient lighting with a restrained warm edge so its scene can relight it, not a bright rim. Isolated on true transparent background with preserved fine fur alpha. No floor, platform, contact shadow drawn into the image, props, outlines, text, or scenery.

## Предметы для второго экрана

Встроенный ImageGen. Общая часть запроса для всех трёх предметов:

> Photorealistic product photography for a cutout sprite in a romantic anniversary website. Warm golden softbox upper-left, dim cool shadows, richly tangible real materials, subtle cinematic film aesthetic and fine details. Entire object isolated on genuinely transparent background. No set, no shadows outside silhouette, no labels, no lettering, no frame.

- `gifts/skate.webp` — One complete classic street skateboard seen from its underside, including realistic silver trucks with four cream urethane wheels, curved birch plywood deck, faded cranberry, teal and honey abstract botanical screen print. Nose oriented straight upward and tail at bottom, near front-on three-quarter view with modest foreshortening. Image output vertical 2:3 composition. Center, 7% clear margin all around, no ground or ambient shadow.
- `gifts/camera.webp` — One complete vintage 35mm compact rangefinder film camera, slightly angled with top and right-hand panels visible, horizontal stance. Brushed champagne metal top and chrome details, dark olive-black pebble leather front, deep glossy glass lens with restrained amber and teal reflections. Small optical viewfinder and film dial, no words, no logo, no flash firing, no accessories. Landscape 3:2 composition. Center, 7% clear margin all around, no ground or ambient shadow.
- `gifts/flowers.webp` — One complete hand-tied bouquet of dusty rose garden roses, ivory ranunculus, burgundy scabiosa, a few slivers of sage green eucalyptus, wrapped in pale pink translucent florist tissue and honey-brown kraft, tied with a small wine-colored soft ribbon. Plentiful lush overlapping petals, asymmetrical natural silhouette, visible stem end and wrap. Vertical 2:3 composition. Center, 7% clear margin all around, no ground or ambient shadow.

## Вечерний сад

Файл: `gifts/garden.webp`. Создан встроенным ImageGen для фона второго экрана.

> Use case: landscape concept art for a premium romantic anniversary website. Create only a wide cinematic background image, a magical but photoreal quiet woodland garden at blue-green dusk. 3:2 landscape landscape composition with a clear center of frame from top to bottom designed for bright overlaid interface text and gift objects. Naturally hazy deep forest green clearing, mist and soft low amber light among lush tall ferns and ivy which enter from the far left/right and especially both bottom corners. View from low eye level facing a soft mossy clearing floor; depth and lens bokeh, delicate distant flecks of amber, tactile realistic leaves and moss. A subtle suggestion of a translucent canopy up near both corners. The center 66% width is gently lit in muted olive/jade and stays quiet with no strongly defined trunks, spots, foreground plants, scenery focal point or vertical lines behind the site content. Maintain a dark, soft upper center for legibility. The image should feel like an expensive cinematic film still, subtle rippling fog near the ground, rich emerald, sage, and antique gold color palette, low contrast in the center. Natural woodland no people, no animals, no stands, no gift boxes, no text, no graphics, no lanterns or moths, no obvious fairy light strings. Full-bleed photographic composition.

## Предметы для воспоминаний сада

Встроенный ImageGen. Общая часть запроса:

> Photorealistic product photography for a small clickable prop in a misty, dark green romantic garden, antique storybook atmosphere. Rich real material textures, warm soft light from upper left, readable silhouette even at 85 pixels, close-up, isolated, with no surface, no backgrounds or cast shadows outside the silhouette, no letters, no decorative frame, uncropped and centered, 8% padding.

- `gifts/lantern.webp` — One ornate antique miniature brass candle lantern. Oval distressed gold brass filigree cage with embossed botanical tracery, antique carry ring with little ivy sprig, glass with dim warm amber candle glow and tiny warm points. Complete object from a slightly three-quarter front view, sitting straight in frame.
- `gifts/letter.webp` — One complete exquisite small antique cream envelope viewed in three quarter angle with a burgundy wax heart seal, tiny pressed dried ivory flower and sage sprig tucked beneath a thread, lightly textured paper and fine gold botanical engraving on corners, no lettering. The envelope is closed and rotated slightly clockwise.
- `gifts/moth.webp` — One complete delicate moth with wings spread diagonally upward, symmetrical anatomical form, ivory cream, tan and warm gold wings with intricately detailed feathery scales, subtle crescent-like dark brown wing marks, fine antennae and soft glowing edges, top view. A believable nocturnal moth.

Запрос для прозрачного фона мотылька:

> Edit this image as a pure background removal task. Keep the golden moth itself, its wing shapes, texture, antennae and pose. Remove and make fully alpha transparent every pixel outside the edges of the moth, including the entire forest, all leaves, bokeh and flowers, including the gap above the head between the antennae. Hard requirement: all four corners alpha=0 and all gaps surrounding the silhouette alpha=0. No added glow, no background visible whatsoever, no dark backing or gradient. Export as a clean sticker cutout on transparent alpha with clean feathery edges, usable as a web overlay.

## Рассвет после сада

Файл: `gifts/dawn.webp`. Создан встроенным ImageGen для экрана, который открывается после шести находок.

> Wide cinematic landscape background for the last screen of a private romantic anniversary website, the first frame of a new day after walking out of a dark garden. Photoreal warm amber dawn in a quiet woodland park, actual green foliage, a pale winding footpath catching soft sunrise light heading into the depth near the middle, gentle luminous fog, a few soft leaves in the foreground. Camera lower eye level, 3:2 horizontal full bleed, premium 35mm still with subtle film texture. Composition with calm open space across the center to accommodate overlay heading and one photo; no high-frequency detail, harsh highlights, or vertical tree trunks in center. Dark olive trees and vegetation in far left and right framing edges, soft sunlit mist and apricot sky near upper center, shadowed moss and deep bronze at bottom. Intended to remain rich and legible when a dark gradient is added over the art. No people, no animals, no writing or graphics, no lens frame, no buildings or props.

## План свидания

Четыре фона и конёк созданы встроенным ImageGen и сохранены в `assets/date/`. Мишка собран из слоёв сцены на крыше. Освещение, движения лап, бокалы и приглашение отрисовываются в браузере.

Общая часть запроса для фонов.

> Use case: photorealistic-natural. Asset: clean background plate for a cinematic browser scene in a realistic plush teddy bear romantic short film. Landscape 3:2 aspect, atmospheric tactile lived-in materials, premium subtle 35mm photography, restrained analog grain, rich natural slightly moody colors. Full bleed, no borders, no animals, people, plush toys, text, prompts, graphic layout or UI. Postproduction will add bear and props, leave the requested space uncluttered.

- `living.webp` — Close three-quarter side angle as if across a low coffee table. An empty plush burgundy-brown velvet couch stretches from left to center, its seat cushion positioned around 67% of image height, inviting a small teddy bear sprite to be added on the left of center later. Tall autumn window directly behind left side with panoramic sky and distant trees, simple warm floor lamp on the far right, a little draped fabric far left. A wide unobstructed low polished wood coffee table fills lower right foreground at about 76% height, as viewed low, no objects on its top. Strong perspective on left sofa arm. Soft apricot daylight neutral enough for relighting.
- `terrace.webp` — Cinematic wide shot on an open old-European rooftop café terrace, camera from near table height, plenty of open slate-blue and apricot sky upper half, rows of slate roofs and a few charming cafe lamps behind. An empty dark café chair appears roughly 57% across, seat around 69% height, to add a small teddy sprite later. Small round dark wood bistro table at about 72% height, centered at 52% across with lots of clear space immediately behind, its polished tabletop visibly elliptical. Balcony railing and warm cafe string lights strung high across background.
- `hall.webp` — Low near-floor camera into a cozy home entryway in late autumn. A low empty antique wood and dark upholstery shoe bench on the right side, with the top of its seat at 62% of the entire image height, clear wall behind it to add a seated small teddy bear sprite later. Dark paneled ajar doorway at the left showing cool soft outdoor daylight; muted deep teal painted walls, subtle coat hooks, wooden floor receding in perspective, with a worn rust woven doormat in front. No shoes or skates. Left distinct window sidelight. Dim enough for warm local lighting to be added later.
- `rink.webp` — Camera a few inches above the ice on an open outdoor skating rink in a historic city courtyard. At the right, dark teal sideboards with a broad warm wooden top handrail slope from 46% image height in middle distance at x=55%, to 51% height at right edge. Do not put a board on the foreground left: uninterrupted open scratched silver-blue ice sweeps across all of the left side, sweeping curved skate marks and faint reflections in foreground. Open sky, distant buildings and tree silhouettes, unlit or gently glowing small rink lights along distant perimeter. Clear right-center ice space in front of the rail will hold a small bear sprite later.
- `skate.webp` — Use case: product-mockup. Isolated asset for a cinematic interactive plush-bear animation. One single miniature classic ice figure skate for a small teddy, viewed side-on and slightly from above, with the rounded toe facing LEFT and the modest stacked heel on the RIGHT. Cream white textured leather, dark walnut outsole, six rows of tightly crossed pale laces and a tied bow, clearly visible shiny silver blade with two mounts and little toe picks. Natural curve on blade. Soft upper-left broad light, subtle neutral shadows and warm stitching, iconic silhouette with large clear shapes at 75px. The product fills 90% of width and height with uniform transparent padding, no cast shadow, no second skate, no feet, no lettering or logo, no floor, no background. Real photography, true transparent alpha.
