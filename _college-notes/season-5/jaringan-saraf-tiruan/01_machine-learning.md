---
title: Machine Learning
layout: single
---


**Sistem Penilaian**

- Tugas 1 = 30% (program)
- Tugas 2 = 50% (review 5 paper)
- UTS = 20%

# Machine Learning

Komputer adalah mesin hitung. Pertama kali komputer dibuat (era 1940-an) para ahli hanya berpikir bagaiman membuat komputasi secepat mungkin dengan ==berbagai teknik dan metode komputasi dikembangkan==.

Sejak 1960-an para ahli mulai membangun konsep komputer bisa belajar dari pengalaman. Pada tahun 1980-an teori yang mendasari machine learning sudah muncul dan perkembangannya tergolong cepat. Machine learning dikelompokkan menjadi 3:

- Era sebelum 1980
	Pada era ini, metode machine learning hanya mampu menghasilkan garis linear pada data atau disebut _linear decision surfaces_.

![](https://automaticaddison.com/wp-content/uploads/2019/07/linearly-separable.png)

- Era 1980-an
	Decision trees dan Artificial Neural Network (ANN) menjadi pelopor dalam pembelajaran non-linear. Namun pijakan teori masih lemah.

![](../assets/img/2022-08-11-22-55-47.png)

- Era 1990 sampai sekarang
	Pada era ini telah dikembangkan metode-metode ==non linear== yang efisien berbasis computational learning theory, dan pijakan teori sudah kuat.

## Klasifikasi Metode Machine Learning

### Dampak yang diharapkan pengguna

1. __Supervised Learning__. Ada targetnya. Contohnya klasifikasi dan regresi
2. __Unsupervised Learning__. Tidak ada targetnya. Contohnya clustering.
	> Dalam clustering jika ingin memprediksi data baru, model harus di train ulang bersama dengan data baru tersebut

### Input dan Output

Dapat dikelompokkan menjadi 2 yaitu __diskrit__ dan __kontinu__. Algoritma dapat menerima input diskrit maupun kontinu dan serta menghasilkan baik diskrit maupun kontinu juga.

### Cara Kerja

Berdasarkan cara kerja, algoritma pembelajaran dikelompokkan menjadi __offline__ dan __online__.

- Offline learning. Berarti model di train hanya sesekali, sehingga performa model pada data baru akan menurun, dan perlu dilakukan train ulang.
- Online learning. Berarti model diperbarui terus berdasarkan observasi baru secara terus menerus.

### Metode Inferensinya

Inferensi == prediksi. Dibedakan menjadi __induktif__ dan __deduktif__.

- Induktif. Penalaran yang __menghasilkan__ suatu kesimpulan __berdasarkan hasil observasi__.
- Deduktif. Penalaran yang menghasilkan suatu kesimpulan secara logis dari premis-premis tertentu.

## Taksonomi Metode-Metode Machine Learning

![](../assets/img/2022-08-11-23-14-24.png)