
-- 1. Add palavras_chave column
ALTER TABLE public.alimentos_taco ADD COLUMN IF NOT EXISTS palavras_chave text[] DEFAULT '{}';

-- 2. Insert TACO data (130 items)
INSERT INTO public.alimentos_taco (numero, nome, grupo, energia_kcal, proteina_g, lipidio_g, carboidrato_g, fibra_g) VALUES
(1, 'Arroz, agulhinha, cozido', 'cereais', 128, 2.5, 0.2, 28.1, 1.6),
(2, 'Arroz, integral, cozido', 'cereais', 124, 2.6, 1.0, 25.8, 2.7),
(3, 'Aveia, flocos', 'cereais', 394, 13.9, 8.5, 66.6, 9.1),
(4, 'Farinha de trigo, integral', 'cereais', 333, 13.0, 2.2, 68.2, 7.2),
(5, 'Farinha de trigo, refinada', 'cereais', 360, 9.8, 1.4, 75.1, 2.3),
(6, 'Macarrão, cozido', 'cereais', 110, 3.8, 0.5, 22.7, 1.8),
(7, 'Pão francês', 'cereais', 300, 8.0, 3.1, 58.6, 2.3),
(8, 'Pão de forma, integral', 'cereais', 253, 8.1, 3.4, 46.7, 6.9),
(9, 'Pão de forma, branco', 'cereais', 270, 7.8, 3.5, 50.7, 2.3),
(10, 'Tapioca, hidratada e grelhada', 'cereais', 149, 0.1, 0.1, 36.9, 0.0),
(11, 'Farinha de mandioca, crua', 'cereais', 361, 1.8, 0.5, 87.6, 6.4),
(12, 'Cuscuz de milho, cozido', 'cereais', 117, 2.1, 1.0, 25.4, 1.4),
(13, 'Granola', 'cereais', 461, 9.8, 14.3, 73.6, 5.9),
(14, 'Quinoa, cozida', 'cereais', 120, 4.4, 1.9, 21.3, 2.8),
(15, 'Batata-doce, cozida', 'cereais', 77, 1.4, 0.1, 18.4, 2.2),
(16, 'Batata inglesa, cozida', 'cereais', 52, 1.2, 0.1, 11.9, 1.8),
(17, 'Mandioca, cozida', 'cereais', 125, 1.1, 0.3, 30.1, 1.9),
(18, 'Inhame, cozido', 'cereais', 94, 2.1, 0.3, 22.4, 3.0),
(19, 'Milho, verde, cozido', 'cereais', 99, 3.1, 2.3, 18.2, 2.6),
(20, 'Biscoito, água e sal', 'cereais', 441, 9.2, 13.3, 71.1, 2.3),
(21, 'Abóbora, cozida', 'verduras', 20, 0.7, 0.1, 4.3, 0.8),
(22, 'Abobrinha, crua', 'verduras', 17, 1.2, 0.2, 3.0, 1.1),
(23, 'Alface, crua', 'verduras', 11, 1.3, 0.2, 1.7, 1.8),
(24, 'Batata baroa, cozida', 'verduras', 80, 1.6, 0.2, 19.1, 2.5),
(25, 'Berinjela, crua', 'verduras', 24, 1.0, 0.2, 5.1, 2.5),
(26, 'Beterraba, crua', 'verduras', 35, 1.9, 0.1, 7.3, 2.8),
(27, 'Brócolis, cozido', 'verduras', 25, 3.0, 0.5, 3.4, 2.6),
(28, 'Cenoura, crua', 'verduras', 34, 1.3, 0.3, 7.0, 3.2),
(29, 'Chuchu, cozido', 'verduras', 19, 0.8, 0.1, 4.2, 1.8),
(30, 'Couve, crua', 'verduras', 29, 3.2, 0.7, 3.4, 2.0),
(31, 'Couve-flor, cozida', 'verduras', 22, 2.4, 0.5, 3.0, 2.6),
(32, 'Espinafre, cozido', 'verduras', 25, 2.7, 0.6, 3.4, 2.5),
(33, 'Pepino, cru', 'verduras', 13, 0.8, 0.1, 2.7, 0.7),
(34, 'Repolho, cru', 'verduras', 20, 1.5, 0.1, 4.0, 2.0),
(35, 'Tomate, cru', 'verduras', 15, 1.1, 0.2, 3.1, 1.2),
(36, 'Quiabo, cozido', 'verduras', 33, 2.1, 0.2, 7.4, 3.2),
(37, 'Pimentão, verde, cru', 'verduras', 20, 0.9, 0.2, 4.3, 1.4),
(38, 'Agrião, cru', 'verduras', 24, 2.8, 0.6, 2.9, 2.5),
(39, 'Acelga, crua', 'verduras', 13, 1.4, 0.1, 1.8, 1.6),
(40, 'Rúcula, crua', 'verduras', 25, 2.6, 0.7, 2.6, 1.6),
(41, 'Abacate', 'frutas', 96, 1.2, 8.4, 6.0, 6.3),
(42, 'Abacaxi', 'frutas', 48, 0.9, 0.1, 12.3, 1.0),
(43, 'Banana, prata', 'frutas', 98, 1.3, 0.1, 26.0, 1.9),
(44, 'Banana, nanica', 'frutas', 92, 1.4, 0.1, 23.8, 1.9),
(45, 'Caju', 'frutas', 43, 0.9, 0.2, 9.8, 1.7),
(46, 'Goiaba', 'frutas', 54, 2.3, 0.4, 10.6, 6.0),
(47, 'Laranja, pera', 'frutas', 37, 1.0, 0.1, 8.9, 1.8),
(48, 'Limão', 'frutas', 32, 1.0, 0.4, 6.9, 2.3),
(49, 'Mamão, formosa', 'frutas', 40, 0.5, 0.1, 10.4, 1.8),
(50, 'Manga', 'frutas', 64, 0.6, 0.3, 16.6, 1.6),
(51, 'Maçã, fuji', 'frutas', 56, 0.3, 0.4, 14.9, 2.0),
(52, 'Melancia', 'frutas', 33, 1.0, 0.2, 7.8, 0.3),
(53, 'Melão', 'frutas', 29, 0.9, 0.2, 6.6, 0.3),
(54, 'Morango', 'frutas', 30, 0.8, 0.3, 6.6, 2.0),
(55, 'Pera', 'frutas', 55, 0.5, 0.1, 14.9, 3.0),
(56, 'Uva, itália', 'frutas', 69, 0.9, 0.3, 17.8, 0.9),
(57, 'Coco, fresco', 'frutas', 354, 3.4, 34.9, 14.3, 9.0),
(58, 'Kiwi', 'frutas', 61, 1.0, 0.6, 14.7, 3.0),
(59, 'Maracujá, suco', 'frutas', 64, 0.7, 0.1, 17.0, 0.0),
(60, 'Acerola', 'frutas', 33, 0.9, 0.2, 7.2, 1.5),
(61, 'Feijão, carioca, cozido', 'leguminosas', 77, 4.8, 0.5, 13.6, 8.5),
(62, 'Feijão, preto, cozido', 'leguminosas', 77, 4.5, 0.5, 14.0, 8.4),
(63, 'Grão-de-bico, cozido', 'leguminosas', 164, 8.9, 2.6, 27.4, 6.0),
(64, 'Lentilha, cozida', 'leguminosas', 93, 6.3, 0.5, 16.3, 3.7),
(65, 'Soja, cozida', 'leguminosas', 141, 14.2, 6.2, 10.0, 9.4),
(66, 'Ervilha, cozida', 'leguminosas', 94, 6.1, 0.3, 17.5, 5.0),
(67, 'Tofu', 'leguminosas', 76, 8.1, 4.8, 1.9, 0.3),
(68, 'Feijão, verde, cozido', 'leguminosas', 44, 2.6, 0.4, 8.1, 3.2),
(69, 'Amendoim, torrado', 'oleaginosas', 581, 26.0, 47.5, 21.4, 8.5),
(70, 'Castanha de caju, torrada', 'oleaginosas', 570, 18.5, 46.3, 29.1, 3.7),
(71, 'Castanha do Pará', 'oleaginosas', 643, 14.3, 63.5, 15.1, 7.9),
(72, 'Nozes', 'oleaginosas', 620, 14.3, 59.4, 18.4, 4.8),
(73, 'Amêndoa', 'oleaginosas', 581, 21.2, 50.6, 19.7, 12.5),
(74, 'Chia, semente', 'oleaginosas', 489, 16.5, 30.7, 42.1, 34.4),
(75, 'Linhaça, semente', 'oleaginosas', 534, 18.3, 42.2, 28.9, 27.3),
(76, 'Gergelim', 'oleaginosas', 565, 20.4, 49.7, 23.4, 7.9),
(77, 'Pasta de amendoim', 'oleaginosas', 598, 25.8, 50.4, 22.3, 6.1),
(78, 'Frango, peito, grelhado', 'carnes', 163, 31.5, 3.2, 0.0, 0.0),
(79, 'Frango, coxa, grelhada', 'carnes', 191, 27.7, 8.1, 0.0, 0.0),
(80, 'Frango, filé, cozido', 'carnes', 159, 32.0, 3.0, 0.0, 0.0),
(81, 'Carne bovina, patinho, grelhado', 'carnes', 219, 33.7, 9.0, 0.0, 0.0),
(82, 'Carne bovina, alcatra, grelhada', 'carnes', 214, 33.4, 8.4, 0.0, 0.0),
(83, 'Carne bovina, acém, cozido', 'carnes', 208, 29.9, 9.8, 0.0, 0.0),
(84, 'Carne bovina, músculo, cozido', 'carnes', 210, 33.2, 8.1, 0.0, 0.0),
(85, 'Carne suína, lombo, grelhado', 'carnes', 184, 31.5, 5.9, 0.0, 0.0),
(86, 'Peixe, atum, em água, enlatado', 'carnes', 130, 27.9, 1.8, 0.0, 0.0),
(87, 'Peixe, sardinha, enlatada', 'carnes', 208, 23.0, 12.7, 0.0, 0.0),
(88, 'Peixe, tilápia, cozida', 'carnes', 128, 26.2, 2.7, 0.0, 0.0),
(89, 'Peixe, salmão, grelhado', 'carnes', 182, 27.3, 7.8, 0.0, 0.0),
(90, 'Camarão, cozido', 'carnes', 99, 20.9, 1.4, 0.0, 0.0),
(91, 'Linguiça, calabresa, grelhada', 'carnes', 306, 16.0, 26.5, 2.0, 0.0),
(92, 'Presunto, cozido', 'carnes', 109, 17.1, 3.9, 1.7, 0.0),
(93, 'Peito de peru, defumado', 'carnes', 110, 20.2, 2.5, 2.0, 0.0),
(94, 'Ovo de galinha, inteiro, cozido', 'ovos', 146, 13.3, 9.5, 0.6, 0.0),
(95, 'Ovo de galinha, clara, crua', 'ovos', 47, 11.1, 0.1, 0.6, 0.0),
(96, 'Ovo de galinha, gema, crua', 'ovos', 328, 16.4, 28.4, 1.4, 0.0),
(97, 'Leite de vaca, integral', 'leites', 61, 3.2, 3.2, 4.6, 0.0),
(98, 'Leite de vaca, desnatado', 'leites', 35, 3.4, 0.1, 4.9, 0.0),
(99, 'Iogurte, natural, integral', 'leites', 64, 3.9, 3.2, 4.7, 0.0),
(100, 'Iogurte, natural, desnatado', 'leites', 43, 4.5, 0.2, 6.1, 0.0),
(101, 'Queijo, minas, frescal', 'leites', 264, 17.4, 20.2, 3.0, 0.0),
(102, 'Queijo, mussarela', 'leites', 300, 22.2, 22.9, 1.3, 0.0),
(103, 'Queijo, cottage', 'leites', 98, 12.4, 4.3, 3.4, 0.0),
(104, 'Requeijão cremoso', 'leites', 270, 8.2, 25.4, 3.6, 0.0),
(105, 'Creme de leite, fresco', 'leites', 235, 2.3, 24.3, 3.8, 0.0),
(106, 'Leite condensado', 'leites', 321, 7.4, 8.6, 54.2, 0.0),
(107, 'Whey protein, concentrado', 'leites', 385, 74.0, 7.0, 10.0, 0.0),
(108, 'Leite de coco', 'leites', 196, 2.3, 19.9, 4.0, 0.5),
(109, 'Bebida de soja, sem adição de açúcar', 'leites', 33, 2.6, 1.9, 1.3, 0.4),
(110, 'Azeite de oliva', 'oleos', 884, 0.0, 100.0, 0.0, 0.0),
(111, 'Óleo de soja', 'oleos', 884, 0.0, 100.0, 0.0, 0.0),
(112, 'Óleo de coco', 'oleos', 884, 0.0, 100.0, 0.0, 0.0),
(113, 'Manteiga', 'oleos', 726, 0.4, 80.8, 0.1, 0.0),
(114, 'Margarina', 'oleos', 543, 0.5, 59.8, 0.6, 0.0),
(115, 'Açúcar, refinado', 'acucares', 387, 0.0, 0.0, 99.8, 0.0),
(116, 'Açúcar mascavo', 'acucares', 375, 0.5, 0.1, 96.5, 0.0),
(117, 'Mel de abelha', 'acucares', 309, 0.4, 0.0, 84.1, 0.2),
(118, 'Geleia, morango', 'acucares', 256, 0.4, 0.1, 66.0, 0.6),
(119, 'Chocolate ao leite', 'acucares', 557, 8.3, 34.0, 55.4, 2.3),
(120, 'Chocolate meio amargo', 'acucares', 509, 6.8, 32.1, 54.9, 5.9),
(121, 'Café, infusão 10%', 'outros', 3, 0.3, 0.1, 0.5, 0.0),
(122, 'Chá, preto, infusão', 'outros', 1, 0.1, 0.0, 0.1, 0.0),
(123, 'Caldo de legumes, caseiro', 'outros', 15, 0.5, 0.5, 2.0, 0.2),
(124, 'Sal, refinado', 'outros', 0, 0.0, 0.0, 0.0, 0.0),
(125, 'Vinagre', 'outros', 4, 0.0, 0.0, 0.9, 0.0),
(126, 'Molho de tomate', 'outros', 44, 1.5, 1.5, 6.5, 1.2),
(127, 'Maionese', 'outros', 656, 1.4, 70.0, 6.2, 0.0),
(128, 'Mostarda', 'outros', 60, 4.0, 3.5, 5.8, 3.2),
(129, 'Proteína de soja texturizada, cozida', 'leguminosas', 104, 14.0, 1.0, 11.0, 4.5),
(130, 'Biomassa de banana verde', 'cereais', 52, 1.8, 0.2, 11.6, 3.0)
ON CONFLICT DO NOTHING;

-- 3. Populate search keywords for common foods
UPDATE public.alimentos_taco SET palavras_chave = '{arroz,branco,agulhinha}' WHERE nome ILIKE '%Arroz, agulhinha%';
UPDATE public.alimentos_taco SET palavras_chave = '{arroz,integral}' WHERE nome ILIKE '%Arroz, integral%';
UPDATE public.alimentos_taco SET palavras_chave = '{aveia,oat}' WHERE nome ILIKE '%Aveia%';
UPDATE public.alimentos_taco SET palavras_chave = '{batata,doce,sweet potato}' WHERE nome ILIKE '%Batata-doce%';
UPDATE public.alimentos_taco SET palavras_chave = '{batata,inglesa}' WHERE nome ILIKE '%Batata inglesa%';
UPDATE public.alimentos_taco SET palavras_chave = '{frango,peito,chicken}' WHERE nome ILIKE '%Frango, peito%';
UPDATE public.alimentos_taco SET palavras_chave = '{frango,coxa}' WHERE nome ILIKE '%Frango, coxa%';
UPDATE public.alimentos_taco SET palavras_chave = '{ovo,egg}' WHERE nome ILIKE '%Ovo de galinha, inteiro%';
UPDATE public.alimentos_taco SET palavras_chave = '{clara,ovo,egg white}' WHERE nome ILIKE '%clara, crua%';
UPDATE public.alimentos_taco SET palavras_chave = '{banana}' WHERE nome ILIKE '%Banana, prata%';
UPDATE public.alimentos_taco SET palavras_chave = '{banana,nanica}' WHERE nome ILIKE '%Banana, nanica%';
UPDATE public.alimentos_taco SET palavras_chave = '{whey,proteina,suplemento}' WHERE nome ILIKE '%Whey protein%';
UPDATE public.alimentos_taco SET palavras_chave = '{pão,frances,padaria}' WHERE nome ILIKE '%Pão francês%';
UPDATE public.alimentos_taco SET palavras_chave = '{pão,integral,forma}' WHERE nome ILIKE '%Pão de forma, integral%';
UPDATE public.alimentos_taco SET palavras_chave = '{feijão,carioca}' WHERE nome ILIKE '%Feijão, carioca%';
UPDATE public.alimentos_taco SET palavras_chave = '{feijão,preto,feijoada}' WHERE nome ILIKE '%Feijão, preto%';
UPDATE public.alimentos_taco SET palavras_chave = '{azeite,olive oil}' WHERE nome ILIKE '%Azeite de oliva%';
UPDATE public.alimentos_taco SET palavras_chave = '{queijo,minas,branco}' WHERE nome ILIKE '%Queijo, minas%';
UPDATE public.alimentos_taco SET palavras_chave = '{iogurte,yogurt}' WHERE nome ILIKE '%Iogurte, natural, integral%';
UPDATE public.alimentos_taco SET palavras_chave = '{salmão,peixe,fish}' WHERE nome ILIKE '%salmão%';
UPDATE public.alimentos_taco SET palavras_chave = '{tilápia,peixe,fish}' WHERE nome ILIKE '%tilápia%';
UPDATE public.alimentos_taco SET palavras_chave = '{atum,peixe,tuna}' WHERE nome ILIKE '%atum%';
UPDATE public.alimentos_taco SET palavras_chave = '{macarrão,massa,pasta}' WHERE nome ILIKE '%Macarrão%';
UPDATE public.alimentos_taco SET palavras_chave = '{tapioca,goma}' WHERE nome ILIKE '%Tapioca%';
UPDATE public.alimentos_taco SET palavras_chave = '{cuscuz,couscous}' WHERE nome ILIKE '%Cuscuz%';
UPDATE public.alimentos_taco SET palavras_chave = '{quinoa,quinua}' WHERE nome ILIKE '%Quinoa%';
UPDATE public.alimentos_taco SET palavras_chave = '{mandioca,aipim,macaxeira}' WHERE nome ILIKE '%Mandioca%';
UPDATE public.alimentos_taco SET palavras_chave = '{inhame,cará}' WHERE nome ILIKE '%Inhame%';
UPDATE public.alimentos_taco SET palavras_chave = '{grão-de-bico,chickpea}' WHERE nome ILIKE '%Grão-de-bico%';
UPDATE public.alimentos_taco SET palavras_chave = '{lentilha,lentil}' WHERE nome ILIKE '%Lentilha%';
UPDATE public.alimentos_taco SET palavras_chave = '{tofu,soja}' WHERE nome ILIKE '%Tofu%';
UPDATE public.alimentos_taco SET palavras_chave = '{amendoim,peanut}' WHERE nome ILIKE '%Amendoim%';
UPDATE public.alimentos_taco SET palavras_chave = '{castanha,caju,cashew}' WHERE nome ILIKE '%Castanha de caju%';
UPDATE public.alimentos_taco SET palavras_chave = '{castanha,pará,brazil nut}' WHERE nome ILIKE '%Castanha do Pará%';
UPDATE public.alimentos_taco SET palavras_chave = '{chia,semente}' WHERE nome ILIKE '%Chia%';
UPDATE public.alimentos_taco SET palavras_chave = '{linhaça,flaxseed}' WHERE nome ILIKE '%Linhaça%';
UPDATE public.alimentos_taco SET palavras_chave = '{leite,integral,milk}' WHERE nome ILIKE '%Leite de vaca, integral%';
UPDATE public.alimentos_taco SET palavras_chave = '{leite,desnatado}' WHERE nome ILIKE '%Leite de vaca, desnatado%';
UPDATE public.alimentos_taco SET palavras_chave = '{cottage,queijo}' WHERE nome ILIKE '%cottage%';
UPDATE public.alimentos_taco SET palavras_chave = '{mussarela,queijo,muçarela}' WHERE nome ILIKE '%mussarela%';
UPDATE public.alimentos_taco SET palavras_chave = '{requeijão,cream cheese}' WHERE nome ILIKE '%Requeijão%';
UPDATE public.alimentos_taco SET palavras_chave = '{alcatra,bife,carne}' WHERE nome ILIKE '%alcatra%';
UPDATE public.alimentos_taco SET palavras_chave = '{patinho,carne,bife}' WHERE nome ILIKE '%patinho%';
UPDATE public.alimentos_taco SET palavras_chave = '{carne,acém,cozido}' WHERE nome ILIKE '%acém%';
UPDATE public.alimentos_taco SET palavras_chave = '{abacate,avocado}' WHERE nome ILIKE '%Abacate%';
UPDATE public.alimentos_taco SET palavras_chave = '{maçã,apple}' WHERE nome ILIKE '%Maçã%';
UPDATE public.alimentos_taco SET palavras_chave = '{mamão,papaya}' WHERE nome ILIKE '%Mamão%';
UPDATE public.alimentos_taco SET palavras_chave = '{morango,strawberry}' WHERE nome ILIKE '%Morango%';
UPDATE public.alimentos_taco SET palavras_chave = '{mel,honey}' WHERE nome ILIKE '%Mel de abelha%';

-- 4. Create function to return default substitutions (seeded per-user via client)
CREATE OR REPLACE FUNCTION public.get_default_substitutions()
RETURNS TABLE(grupo text, alimento_original text, alimento_substituto text, observacoes text)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  VALUES
  -- CEREAIS
  ('cereais', 'Arroz branco', 'Arroz integral', 'Maior teor de fibras'),
  ('cereais', 'Arroz branco', 'Quinoa cozida', 'Rica em proteínas e fibras'),
  ('cereais', 'Pão francês', 'Pão integral', 'Mais fibra, menor IG'),
  ('cereais', 'Pão francês', 'Tapioca', 'Sem glúten'),
  ('cereais', 'Macarrão', 'Macarrão integral', 'Mais fibra'),
  ('cereais', 'Batata inglesa', 'Batata-doce', 'Menor IG, mais fibra'),
  ('cereais', 'Batata inglesa', 'Inhame', 'Fonte de fibra e potássio'),
  ('cereais', 'Batata inglesa', 'Mandioca cozida', 'Opção energética'),
  ('cereais', 'Farinha de trigo', 'Farinha de aveia', 'Mais fibra e proteína'),
  ('cereais', 'Granola', 'Aveia em flocos', 'Menos açúcar'),
  -- VERDURAS
  ('verduras', 'Alface', 'Rúcula', 'Mais ferro e cálcio'),
  ('verduras', 'Alface', 'Agrião', 'Rico em vitamina C'),
  ('verduras', 'Brócolis', 'Couve-flor', 'Similar em calorias'),
  ('verduras', 'Brócolis', 'Espinafre', 'Rico em ferro'),
  ('verduras', 'Cenoura', 'Abóbora', 'Rica em betacaroteno'),
  ('verduras', 'Cenoura', 'Beterraba', 'Fonte de nitrato'),
  -- FRUTAS
  ('frutas', 'Banana', 'Maçã', 'Menor IG'),
  ('frutas', 'Banana', 'Pera', 'Rica em fibras'),
  ('frutas', 'Laranja', 'Acerola', 'Mais vitamina C'),
  ('frutas', 'Laranja', 'Goiaba', 'Rica em fibra e vitamina C'),
  ('frutas', 'Manga', 'Mamão', 'Menor calorias, rico em fibra'),
  ('frutas', 'Melancia', 'Melão', 'Similar em calorias'),
  ('frutas', 'Abacaxi', 'Kiwi', 'Rico em vitamina C e fibra'),
  ('frutas', 'Uva', 'Morango', 'Menos calorias, mais fibra'),
  -- LEGUMINOSAS
  ('leguminosas', 'Feijão carioca', 'Feijão preto', 'Similar nutricionalmente'),
  ('leguminosas', 'Feijão carioca', 'Lentilha', 'Mais proteína, cozimento rápido'),
  ('leguminosas', 'Feijão carioca', 'Grão-de-bico', 'Versátil, mais proteína'),
  ('leguminosas', 'Soja', 'Tofu', 'Menor caloria, boa proteína'),
  ('leguminosas', 'Feijão', 'Ervilha', 'Opção leve'),
  -- OLEAGINOSAS
  ('oleaginosas', 'Amendoim', 'Castanha de caju', 'Menos alérgico'),
  ('oleaginosas', 'Castanha do Pará', 'Nozes', 'Rica em ômega-3'),
  ('oleaginosas', 'Amendoim', 'Amêndoa', 'Mais cálcio e fibra'),
  ('oleaginosas', 'Pasta de amendoim', 'Pasta de castanha de caju', 'Mais suave'),
  -- CARNES
  ('carnes', 'Frango, peito', 'Peixe, tilápia', 'Mais leve, fonte de ômega'),
  ('carnes', 'Carne bovina, alcatra', 'Frango, peito', 'Menos gordura'),
  ('carnes', 'Carne bovina', 'Peixe, salmão', 'Rico em ômega-3'),
  ('carnes', 'Linguiça', 'Peito de peru', 'Menos gordura e sódio'),
  ('carnes', 'Presunto', 'Peito de peru', 'Menos gordura'),
  -- OVOS
  ('ovos', 'Ovo inteiro', 'Clara de ovo (2 unidades)', 'Sem gordura, pura proteína'),
  -- LEITES
  ('leites', 'Leite integral', 'Leite desnatado', 'Menos gordura'),
  ('leites', 'Leite integral', 'Bebida de soja', 'Sem lactose'),
  ('leites', 'Iogurte integral', 'Iogurte desnatado', 'Menos gordura'),
  ('leites', 'Queijo mussarela', 'Queijo cottage', 'Muito menos gordura'),
  ('leites', 'Queijo mussarela', 'Queijo minas frescal', 'Menos calórico'),
  ('leites', 'Requeijão', 'Queijo cottage', 'Menos gordura'),
  ('leites', 'Creme de leite', 'Iogurte natural', 'Menos gordura'),
  -- ÓLEOS
  ('oleos', 'Óleo de soja', 'Azeite de oliva', 'Gordura monoinsaturada'),
  ('oleos', 'Manteiga', 'Azeite de oliva', 'Gordura mais saudável'),
  ('oleos', 'Margarina', 'Manteiga', 'Sem gordura trans'),
  -- AÇÚCARES
  ('acucares', 'Açúcar refinado', 'Açúcar mascavo', 'Mais minerais'),
  ('acucares', 'Açúcar refinado', 'Mel', 'Natural, com antioxidantes'),
  ('acucares', 'Chocolate ao leite', 'Chocolate meio amargo', 'Menos açúcar, mais cacau');
$$;
