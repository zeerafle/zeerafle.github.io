---
title: Pengantar Jaringan Saraf Tiruan
layout: single
read_time: true
toc: true
sidebar:
  nav: season-5
---


## Jaringan Saraf Biologi

Jaringan saraf biologi merupakan kumpulandari banyak sel saraf (neuron) yang saling terhubung. Salah satu contohnya otak manusia. Bertambah dewasa manusia akan bertambah pula kepandaiannya karena <mark>informasi yang diterimanya semakin banyak</mark>.

Secara umum sel saraf terdiri dari 3 bagian:

- Dendrit. Ini menjadi input
- Soma. Menjadi pemroses informasi dari input melalui fungsi aktivasi
- Axon. Output (atau terhubung ke neuron lain)

![](../assets/img/2022-08-16-21-15-10.png)

## Jaringan Saraf Tiruan

Jaringan Saraf Tiruan (JST) merupakan sistem pemrosesan informasi yang meniru cara kerja jaringan saraf biologis (otak manusia). Sejumlah metode/algoritma pelatihan (training) telah dikembangkan masing-masing dengan kelebihan dan kekurangannya.

Contoh algoritma training, antara lain:

- Hebb
- Perceptron
- Adaline
- Hopfield
- Bidirectional Associative Memory (BAM)
- Backpropagation, dll.

Belum ada "guide" untuk memilih model yang tepat untuk training yang dilakukan.

## Model Neuron

**Neuron** adalah unit pemroses informasi yang menjadi dasar dalam pengoperasian JST. Neuron terdiri dari 3 elemen:

1. Himpunan unit-unit. Dihubungkan dengan jalur koneksi. Jalur-jalur tersebut memiliki bobot yang berbeda-beda
2. Unit penjumlahan. Akan menjumlahkan input-input sinyal yang sudah dikalikan dengan bobotnya -> Metode training.
    
    Misalkan:

    $x_1, x_2, \dots, x_n$ = unit-unit input
    $$w_{j1}, w_{j2}, \dots, w_{jn}$$ = bobot penghubung dari unit input ke unit output $$Y_j$$.

    Maka unit penjumlahan akan memberikan keluaran sebesar $$uj = x_1 \cdot w_{j1} + x_2 \cdot w_{j2} + \dots + x_n \cdot w_{jn}$$
    
3. Fungsi aktivasi. Akan menentukan <mark>apakah sinyal dari input neuron akan diteruskan ke neuron lain atau tidak</mark>

![](https://miro.medium.com/max/1040/1*TbOZ8WiqXTckkaQpZq0Xaw.png)

## Arsitektur Jaringan

1. Jaringan Lapis Tunggal (single layer network)
   
   ![](https://usercontent1.hubstatic.com/3993124_f520.jpg)

   - Input langsung dihubungkan dengan output
   - Selama proses pelatihan, bobot-bobot tersebut akan dimodifikasi untuk meningkatkan keakuratan hasil.
   - Dapat digunakan untuk pengenalan pola sederhana.

2. Jaringan Lapis Jamak (multi layer network)
   
   ![](https://www.researchgate.net/profile/Maria_Haritou/publication/291339457/figure/fig1/AS:334187497312256@1456687916125/Typical-structure-of-a-feed-forward-multilayer-neural-network.png)

   - Perluasan jaringan lapis tunggal
   - Ada satu/beberapa layer tersembunyi yang terdiri dari beberapa unit neuron

3. Jaringan Recurrent
   
   ![](https://cdn-images-1.medium.com/max/1200/1*K6s4Li0fTl1pSX4-WPBMMA.jpeg)
   
   Mirip dengan jaringan lapis tunggal ataupun ganda. Hanya saja ada neuron output yang memberikan sinyal pada unit input (sering disebut feedback loop)

## Fungsi Aktivasi

Dipakai untuk menentukan keluaran suatu neuron.

$$\text{jika } net = \Sigma{x_i w_i}$$

$$\text{maka fungsi aktivasinya } f(net) = f(\Sigma{x_i w_i})$$

### Beberapa fungsi aktivasi yang sering dipakai:

1. Fungsi threshold (batas ambang $$a$$)
   
Biner:

$$
f(net) = \begin{cases}
1 \text{ jika net} \geq a \\
0 \text{ jika net} \lt a
\end{cases}
$$

Bipolar:

$$
f(net) = \begin{cases}
1 \text{ jika net} \geq a \\
-1 \text{ jika net} \lt a
\end{cases}
$$

2. Fungsi sigmoid

$$f(net) = \frac{1}{1+e^{-net}}$$

Fungsi sigmoid sering dipakai karena <mark> fungsinya yang terletak antara 0 dan 1</mark> dan dapat diturunkan dengan mudah.

$$f'(x) = f(x) (1-f(x))$$

3. Fungsi identitas

$$f(net) = net$$

Digunakan apabila kita menginginkan keluaran jaringan berupa sembaran bilangan riil. In other words nilai nya adalah hasil aslinya.

## Bias & Threshold

**Bias** adalah sebuah input tambahan yang nilainya selalu = 1.

[![](https://qph.fs.quoracdn.net/main-qimg-045c821538df289d43b0af89f042d037)](https://www.quora.com/What-is-bias-in-artificial-neural-network)

Bias berfungsi untuk mengubah nilai threshold menjadi $$= 0$$ (bukan $$= a$$). Jika melibatkan bias, maka keluaran unit penjumlah adalah

$$net = b + \Sigma{x_i w_i}$$

Fungsi aktivasi threshold (bipolar menjadi menjadi)

$$
f(net) = \begin{cases}
1 \text{ jika net} \geq 0 \\
-1 \text{ jika net} \lt 0
\end{cases}
$$

### Contoh:

Suatu jaringan layer tunggal berikut ini terdiri dari 2 input $$x_1 = 0.7$$ dan $$x_2 = 2.1$$ dan memiliki bias. Bobot garis $$w_1 = 0.5$$; $$w_2 = -0.3$$ dan bobot bias $$= b = 1.2$$. Tentukan keluaran neuron Y jika fungsi aktivasinya:

- threshold bipolar
- threshold biner
- sigmoid
- identitas