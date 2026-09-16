FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Berkas mesin ikut disimpan di repo, jadi build image tidak memerlukan repo
# aplikasi desktop. Sidik jarinya tetap diperiksa supaya salinan yang
# tercampur tanpa disengaja tidak lolos ke produksi.
RUN npm run engine:verify-generated

RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

